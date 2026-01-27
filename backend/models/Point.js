import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Point = sequelize.define('Point', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  probleme_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  point_statut_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'points',
  timestamps: false,
});

export default Point;
