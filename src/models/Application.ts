import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface AppAttributes {
  id: number;
  jobId: number;
  candidateId: number;
  status: string;
}

interface AppCreationAttributes extends Optional<AppAttributes, 'id' | 'status'> {}

export class Application extends Model<AppAttributes, AppCreationAttributes> {
  public id!: number;
  public status!: string;
  public jobId!: number;
  public candidateId!: number;
}

Application.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM('applied', 'screening', 'interview', 'offer', 'hired', 'rejected'),
    defaultValue: 'applied',
  },
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  tableName: 'applications',
});