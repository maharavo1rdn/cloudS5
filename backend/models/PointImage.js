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
  firebase_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false,
    comment: 'ID du document Firestore pour cette image'
  },
  last_synced_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp de la dernière synchronisation avec Firebase'
  }
}, {
  tableName: 'points_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default PointImage;
