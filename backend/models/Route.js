import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Route = sequelize.define('Route', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  probleme_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  statut: {
    type: DataTypes.STRING(20),
    defaultValue: 'NOUVEAU',
  },
  surface_m2: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  entreprise_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  date_detection: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  date_fin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  avancement_pourcentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'routes',
  timestamps: false,
});

export default Route;
