import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface JobAttributes {
  id: number;
  title: string;
  description: string;
  status: string;
  recruiterId: number;
}

// FIX IS HERE: We added 'status' to the list of optional fields
interface JobCreationAttributes extends Optional<JobAttributes, 'id' | 'status'> {}

export class Job extends Model<JobAttributes, JobCreationAttributes> {
  public id!: number;
  public title!: string;
  public description!: string;
  public status!: string;
  public recruiterId!: number;
}

Job.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open',
  },
  recruiterId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'jobs',
});