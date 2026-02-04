import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PointHisto = sequelize.define('PointHisto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  point_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'points',
      key: 'id'
    }
  },
  point_statut_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'point_statut',
      key: 'id'
    }
  },
  avancement_pourcentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  firebase_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID de l\'entrée dans Firestore points_histo'
  },
  last_synced_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp de la dernière synchronisation pour cette entrée historique'
  }
}, {
  tableName: 'points_histo',
  timestamps: false,
});

export default PointHisto;
