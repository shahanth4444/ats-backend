import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CompanyAttributes {
    id: number;
    name: string;
    description?: string;
    status: string;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'description' | 'status'> { }

export class Company extends Model<CompanyAttributes, CompanyCreationAttributes> {
    public id!: number;
    public name!: string;
    public description?: string;
    public status!: string;
}

Company.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
    },
}, {
    sequelize,
    tableName: 'companies',
    timestamps: true,
});
