import Entreprise from './Entreprise.js';
import Probleme from './Probleme.js';
import Route from './Route.js';
import RoutePoint from './RoutePoint.js';

export default function setupAssociations() {
  // Définir les relations
  Route.belongsTo(Entreprise, { 
    foreignKey: 'entreprise_id', 
    as: 'entreprise' 
  });
  
  Route.belongsTo(Probleme, { 
    foreignKey: 'probleme_id', 
    as: 'probleme' 
  });
  
  Route.hasMany(RoutePoint, { 
    foreignKey: 'route_id', 
    as: 'points' 
  });
  
  RoutePoint.belongsTo(Route, { 
    foreignKey: 'route_id', 
    as: 'route' 
  });

  // Relations inverses
  Entreprise.hasMany(Route, { 
    foreignKey: 'entreprise_id', 
    as: 'routes' 
  });
  
  Probleme.hasMany(Route, { 
    foreignKey: 'probleme_id', 
    as: 'routes' 
  });

  console.log('✅ Associations définies avec succès');
}