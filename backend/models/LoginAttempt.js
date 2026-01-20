import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LoginAttempt = sequelize.define('LoginAttempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_attempt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  blocked_until: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'login_attempts',
  timestamps: false,
});

export default LoginAttempt;
