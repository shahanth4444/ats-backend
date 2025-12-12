import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class ApplicationHistory extends Model {}

ApplicationHistory.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  old_status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  new_status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // We will link this to Application and User (Recruiter) later
}, {
  sequelize,
  tableName: 'application_histories',
});