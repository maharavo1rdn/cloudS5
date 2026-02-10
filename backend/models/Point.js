import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Point = sequelize.define('Point', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nom/titre du point de signalement'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée du problème'
  },
  probleme_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  surface_m2: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  entreprise_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  date_detection: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  date_fin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  avancement_pourcentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
  },
  point_statut_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'point_statut',
      key: 'id'
    }
  },
  firebase_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID du document Firestore correspondant'
  },
  last_synced_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp de la dernière synchronisation avec Firebase'
  },
  niveau: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    },
    comment: 'Niveau de priorité du point (1-10)'
  },
  prix_par_m2: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Prix par m² pour cette intervention'
  }
}, {
  tableName: 'points',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Hook afterUpdate pour créer automatiquement une entrée dans points_histo
Point.addHook('afterUpdate', async (point, options) => {
  try {
    // Import dynamique pour éviter les dépendances circulaires
    const { default: PointHisto } = await import('./PointHisto.js');
    
    // Vérifier si point_statut_id ou avancement_pourcentage a changé
    const changed = point.changed();
    if (changed && (changed.includes('point_statut_id') || changed.includes('avancement_pourcentage'))) {
      await PointHisto.create({
        point_id: point.id,
        point_statut_id: point.point_statut_id,
        avancement_pourcentage: point.avancement_pourcentage,
        // Use current timestamp to reflect when the change actually occurred
        date: new Date()
      }, { transaction: options.transaction });
      
      console.log(`✅ Historique créé pour point ${point.id}`);
    }
  } catch (error) {
    console.error(`❌ Erreur création historique pour point ${point.id}:`, error);
    // Ne pas bloquer la mise à jour du point même si l'historique échoue
  }
});

// Hook afterCreate pour créer l'entrée initiale dans points_histo
Point.addHook('afterCreate', async (point, options) => {
  try {
    const { default: PointHisto } = await import('./PointHisto.js');
    
    await PointHisto.create({
      point_id: point.id,
      point_statut_id: point.point_statut_id,
      avancement_pourcentage: point.avancement_pourcentage || 0,
      // Use current timestamp for the initial history entry
      date: new Date()
    }, { transaction: options.transaction });
    
    console.log(`✅ Historique initial créé pour point ${point.id}`);
  } catch (error) {
    console.error(`❌ Erreur création historique initial pour point ${point.id}:`, error);
  }
});

export default Point;
