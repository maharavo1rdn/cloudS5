import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Entreprise = sequelize.define('Entreprise', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
}, {
  tableName: 'entreprises',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Entreprise;
