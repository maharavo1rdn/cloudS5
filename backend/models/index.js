import sequelize from '../config/database.js';
import Entreprise from './Entreprise.js';
import Probleme from './Probleme.js';
import Route from './Route.js';
import RoutePoint from './RoutePoint.js';
import setupAssociations from './setupAssociations.js';

// Initialisez les associations
setupAssociations();

const models = {
  Entreprise,
  Probleme,
  Route,
  RoutePoint,
  sequelize,
};

export default models;