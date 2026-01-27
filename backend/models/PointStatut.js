import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PointStatut = sequelize.define('PointStatut', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING(255),
  },
  niveau: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: 'point_statut',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default PointStatut;