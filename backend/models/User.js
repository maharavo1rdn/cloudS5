import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Role from './Role.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Role,
      key: 'id',
    },
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  firebase_uid: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'UID Firebase Auth de l\'utilisateur'
  },
  last_synced_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp de la dernière synchronisation avec Firebase'
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['firebase_uid'],
      name: 'users_firebase_uid_unique'
    }
  ]
});

// Association
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

export default User;