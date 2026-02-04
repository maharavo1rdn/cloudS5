// models/associations.js
import Point from './Point.js';
import Signalement from './Signalement.js';
import SignalementHistorique from './SignalementHistorique.js';
import Probleme from './Probleme.js';
import Entreprise from './Entreprise.js';
import PointStatut from './PointStatut.js';
import PointImage from './PointImage.js';
import PointHisto from './PointHisto.js';
import User from './User.js';
import LoginAttempt from './LoginAttempt.js';

export const setupAssociations = () => {
  // User hasOne LoginAttempt
  User.hasOne(LoginAttempt, {
    foreignKey: 'user_id',
    as: 'LoginAttempt'
  });

  // LoginAttempt belongsTo User
  LoginAttempt.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // Point belongsTo Probleme
  Point.belongsTo(Probleme, {
    foreignKey: 'probleme_id',
    as: 'probleme'
  });

  // Probleme hasMany Point
  Probleme.hasMany(Point, {
    foreignKey: 'probleme_id',
    as: 'points'
  });

  // Point belongsTo Entreprise
  Point.belongsTo(Entreprise, {
    foreignKey: 'entreprise_id',
    as: 'entreprise'
  });

  // Entreprise hasMany Point
  Entreprise.hasMany(Point, {
    foreignKey: 'entreprise_id',
    as: 'points'
  });

  // Point belongsTo PointStatut
  Point.belongsTo(PointStatut, {
    foreignKey: 'point_statut_id',
    as: 'statut'
  });

  // PointStatut hasMany Point
  PointStatut.hasMany(Point, {
    foreignKey: 'point_statut_id',
    as: 'points'
  });

  // Point hasMany PointImage (un point peut avoir plusieurs images)
  Point.hasMany(PointImage, {
    foreignKey: 'point_id',
    as: 'images',
    onDelete: 'CASCADE'
  });

  // PointImage belongsTo Point
  PointImage.belongsTo(Point, {
    foreignKey: 'point_id',
    as: 'point'
  });

  // Point hasMany PointHisto (historique des changements)
  Point.hasMany(PointHisto, {
    foreignKey: 'point_id',
    as: 'historique'
  });

  // PointHisto belongsTo Point
  PointHisto.belongsTo(Point, {
    foreignKey: 'point_id',
    as: 'point'
  });

  // PointHisto belongsTo PointStatut
  PointHisto.belongsTo(PointStatut, {
    foreignKey: 'point_statut_id',
    as: 'statut'
  });

  console.log('✅ Associations Sequelize configurées');
};