// models/associations.js
import Point from './Point.js';
import Signalement from './Signalement.js';
import SignalementHistorique from './SignalementHistorique.js';
import Probleme from './Probleme.js';
import Entreprise from './Entreprise.js';
import PointStatut from './PointStatut.js';
import User from './User.js';

export const setupAssociations = () => {
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

  // Signalement hasMany SignalementHistorique
  Signalement.hasMany(SignalementHistorique, {
    foreignKey: 'signalement_id',
    as: 'historiques'
  });

  // SignalementHistorique belongsTo Signalement
  SignalementHistorique.belongsTo(Signalement, {
    foreignKey: 'signalement_id',
    as: 'signalement'
  });

  // SignalementHistorique belongsTo User
  SignalementHistorique.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  console.log('✅ Associations Sequelize configurées');
};