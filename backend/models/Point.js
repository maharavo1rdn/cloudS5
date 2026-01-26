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
    references: {
      model: 'problemes',
      key: 'id'
    }
  },
  surface_m2: {
    type: DataTypes.DECIMAL(10, 2),
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
  },
  entreprise_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'entreprises',
      key: 'id'
    }
  },
  date_detection: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  date_debut: {
    type: DataTypes.DATE,
  },
  date_fin: {
    type: DataTypes.DATE,
  },
  avancement_pourcentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
  },
  point_statut_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'point_statut',
      key: 'id'
    }
  }
}, {
  tableName: 'points',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Point;