import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PointImage = sequelize.define('PointImage', {
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
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  firebase_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL Firebase Storage si image uploadée là-bas'
  },
}, {
  tableName: 'points_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default PointImage;
