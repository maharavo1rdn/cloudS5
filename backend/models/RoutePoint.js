import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RoutePoint = sequelize.define('RoutePoint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  ordre: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  point_statut: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'A_TRAITER',
    validate: {
      isIn: [['A_TRAITER', 'EN_COURS', 'FINI']]
    }
  },
}, {
  tableName: 'route_points',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default RoutePoint;