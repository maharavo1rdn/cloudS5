import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Signalement from './Signalement.js';
import User from './User.js';

const SignalementHistorique = sequelize.define('SignalementHistorique', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  signalement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Signalement,
      key: 'id',
    },
  },
  ancien_statut: {
    type: DataTypes.ENUM('NOUVEAU', 'EN_COURS', 'TERMINE'),
    allowNull: true,
  },
  nouveau_statut: {
    type: DataTypes.ENUM('NOUVEAU', 'EN_COURS', 'TERMINE'),
    allowNull: false,
  },
  ancien_avancement: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  nouveau_avancement: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  date_modification: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'signalement_historique',
  timestamps: false,
});

// Les associations sont définies dans associations.js

export default SignalementHistorique;
