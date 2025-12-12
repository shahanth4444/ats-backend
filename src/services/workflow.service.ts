import { sequelize, Application, ApplicationHistory } from '../models';

// 1. Define the Rules (State Machine)
const VALID_TRANSITIONS: Record<string, string[]> = {
  'applied': ['screening', 'rejected'],
  'screening': ['interview', 'rejected'],
  'interview': ['offer', 'rejected'],
  'offer': ['hired', 'rejected'],
  'rejected': [], // No way out
  'hired': []     // No way out
};

export const changeStatus = async (appId: number, newStatus: string, userId: number) => {
  // Start a transaction
  const t = await sequelize.transaction();

  try {
    const app = await Application.findByPk(appId, { transaction: t });

    if (!app) throw new Error('Application not found');

    const currentStatus = app.getDataValue('status');

    // 2. Validate the Move
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Invalid transition: Cannot move from ${currentStatus} to ${newStatus}`);
    }

    // 3. Update the Application
    await app.update({ status: newStatus }, { transaction: t });

    // 4. Create the History Record
    await ApplicationHistory.create({
      applicationId: appId,
      changedById: userId, // The recruiter who did this
      old_status: currentStatus,
      new_status: newStatus
    }, { transaction: t });

    // 5. Commit (Save everything)
    await t.commit();

    console.log(`✅ Success! Moved App #${appId} to ${newStatus}`);
    return app;

  } catch (error) {
    // If anything fails, undo everything
    await t.rollback();
    throw error;
  }
};