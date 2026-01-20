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
  etat: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'EN_TRAVAUX',
    validate: {
      isIn: [['FINI', 'EN_TRAVAUX', 'EN_ATTENTE', 'INTACTE', 'ENDOMMAGEE']]
    }
  },
  statut: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'NOUVEAU',
    validate: {
      isIn: [['NOUVEAU', 'EN_COURS', 'TERMINE']]
    }
  },
  surface_m2: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  avancement_pourcentage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  date_detection: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  date_debut: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  date_fin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'routes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Route;