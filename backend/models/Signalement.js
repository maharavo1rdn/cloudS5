import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Entreprise from './Entreprise.js';
import Probleme from './Probleme.js';

const Signalement = sequelize.define('Signalement', {
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
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  probleme_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Probleme,
      key: 'id',
    },
  },
  statut: {
    type: DataTypes.ENUM('NOUVEAU', 'EN_COURS', 'TERMINE'),
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
    references: {
      model: Entreprise,
      key: 'id',
    },
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
  synced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  firebase_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'signalements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Associations
Signalement.belongsTo(Entreprise, { foreignKey: 'entreprise_id', as: 'entreprise' });
Signalement.belongsTo(Probleme, { foreignKey: 'probleme_id', as: 'probleme' });

export default Signalement;
