import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RoutePoint = sequelize.define('RoutePoint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  route_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
    defaultValue: 'A_TRAITER',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'route_points',
  timestamps: false,
});

export default RoutePoint;
