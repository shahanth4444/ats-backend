import { changeStatus } from '../../services/workflow.service';
import { sequelize, Application, ApplicationHistory } from '../../models';

describe('Workflow Service', () => {
    beforeAll(async () => {
        // Sync database for testing
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('changeStatus', () => {
        it('should allow valid transition from applied to screening', async () => {
            // Create test application
            const app = await Application.create({
                jobId: 1,
                candidateId: 1,
                status: 'applied'
            });

            const result = await changeStatus(app.id, 'screening', 1);

            expect(result.getDataValue('status')).toBe('screening');

            // Verify history was created
            const history = await ApplicationHistory.findOne({
                where: { applicationId: app.id }
            });

            expect(history).toBeTruthy();
            expect(history?.getDataValue('old_status')).toBe('applied');
            expect(history?.getDataValue('new_status')).toBe('screening');
        });

        it('should reject invalid transition from applied to offer', async () => {
            const app = await Application.create({
                jobId: 1,
                candidateId: 1,
                status: 'applied'
            });

            await expect(changeStatus(app.id, 'offer', 1)).rejects.toThrow(
                'Invalid transition: Cannot move from applied to offer'
            );
        });

        it('should allow transition to rejected from any status', async () => {
            const app = await Application.create({
                jobId: 1,
                candidateId: 1,
                status: 'interview'
            });

            const result = await changeStatus(app.id, 'rejected', 1);

            expect(result.getDataValue('status')).toBe('rejected');
        });

        it('should not allow transition from rejected', async () => {
            const app = await Application.create({
                jobId: 1,
                candidateId: 1,
                status: 'rejected'
            });

            await expect(changeStatus(app.id, 'screening', 1)).rejects.toThrow(
                'Invalid transition'
            );
        });

        it('should rollback on error', async () => {
            const app = await Application.create({
                jobId: 1,
                candidateId: 1,
                status: 'applied'
            });

            // Try invalid transition
            try {
                await changeStatus(app.id, 'hired', 1);
            } catch (error) {
                // Expected to fail
            }

            // Verify status unchanged
            const updatedApp = await Application.findByPk(app.id);
            expect(updatedApp?.getDataValue('status')).toBe('applied');

            // Verify no history was created
            const historyCount = await ApplicationHistory.count({
                where: { applicationId: app.id }
            });
            expect(historyCount).toBe(0);
        });
    });
});
