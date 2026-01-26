import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Probleme = sequelize.define('Probleme', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  }
}, {
  tableName: 'problemes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Probleme;