import { sequelize } from '../config/database';
import { User } from './User';
import { Job } from './Job';
import { Application } from './Application';
import { ApplicationHistory } from './ApplicationHistory';
import { Company } from './Company';

// Company Relationships
Company.hasMany(User, { foreignKey: 'companyId' });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(Job, { foreignKey: 'companyId' });
Job.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// User-Job Relationships
User.hasMany(Job, { foreignKey: 'recruiterId' });
Job.belongsTo(User, { foreignKey: 'recruiterId', as: 'recruiter' });

// Job-Application Relationships
Job.hasMany(Application, { foreignKey: 'jobId' });
Application.belongsTo(Job, { foreignKey: 'jobId' });

// User-Application Relationships
User.hasMany(Application, { foreignKey: 'candidateId' });
Application.belongsTo(User, { foreignKey: 'candidateId', as: 'candidate' });

// History Relationships
Application.hasMany(ApplicationHistory, { foreignKey: 'applicationId' });
ApplicationHistory.belongsTo(Application, { foreignKey: 'applicationId' });

User.hasMany(ApplicationHistory, { foreignKey: 'changedById' }); // Who made the change?
ApplicationHistory.belongsTo(User, { foreignKey: 'changedById', as: 'changedBy' });

export { sequelize, User, Job, Application, ApplicationHistory, Company };