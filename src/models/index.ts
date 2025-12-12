import { sequelize } from '../config/database';
import { User } from './User';
import { Job } from './Job';
import { Application } from './Application';
import { ApplicationHistory } from './ApplicationHistory'; // <--- IMPORT THIS

// Relationships
User.hasMany(Job, { foreignKey: 'recruiterId' });
Job.belongsTo(User, { foreignKey: 'recruiterId', as: 'recruiter' });

Job.hasMany(Application, { foreignKey: 'jobId' });
Application.belongsTo(Job, { foreignKey: 'jobId' });

User.hasMany(Application, { foreignKey: 'candidateId' });
Application.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

// History Relationships
Application.hasMany(ApplicationHistory, { foreignKey: 'applicationId' });
ApplicationHistory.belongsTo(Application, { foreignKey: 'applicationId' });

User.hasMany(ApplicationHistory, { foreignKey: 'changedById' }); // Who made the change?
ApplicationHistory.belongsTo(User, { foreignKey: 'changedById', as: 'changedBy' });

export { sequelize, User, Job, Application, ApplicationHistory };