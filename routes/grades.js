const express = require('express');
const Class = require('../models').class;
const Source = require('../models').source;
const Annotation = require('../models').annotation;
const GradingSystem = require('../models').grading_system;
const GradingThreshold = require('../models').grading_threshold;
const CriteriaCount = require('../models').criteria_count;
const Criteria = require('../models').criteria;
const router = express.Router();

/**
 * Get grading systems of a class.
 * @name GET/api/grades/gradingSystems
 */
router.get('/gradingSystems', (req, res) => {
  if (!req.session.classId){
    res.status(200).json(null);
    return null;
  }
  Class.findByPk(req.session.classId,{include: [{
      association: 'GradingSystems',
      include: [{
        association: 'GradingThresholds',
        include: [{
          association: 'CriteriaCounts',
          attributes: ['id','num_annotations', 'criteria_id'] 
        }],
        order: [
          [GradingThreshold, 'score', 'DESC']
        ]
      },
      {association: 'Criteria'}
    ]
    }]
  }).then((nb_class) => {
    res.status(200).json(nb_class.GradingSystems);
  });
});


/**
 * Set grading threshold of a class.
 * @name POST/api/grades/gradingSystems
 * @param id: id of grading system to add threshold to
 */
router.post('/threshold/:id', (req, res) => {
  GradingThreshold.create({
    label: req.body.label,
    score: req.body.points,
    total_comments: req.body.totalComments,
    total_words: req.body.totalWords,
    total_tags: req.body.totalTags,
    total_chars: req.body.totalChars,
    grading_system_id: req.params.id,
    CriteriaCounts: Object.keys(req.body.customCriteria).map(id => {
      return {
        criteria_id: id,
        num_annotations: req.body.customCriteria[id]
      };
    })
  },{
    include:[{association: 'CriteriaCounts'}]
  })
  .then(threshold => {
    res.status(200).json(threshold);
  });
});

/**
 * Edit grading threshold of a class.
 * @name GET/api/grades/gradingSystems
 * @param id: id of grading threshold
 */
router.put('/threshold/:id', (req, res) => {
  GradingThreshold.findByPk(req.params.id).then(threshold => 
    threshold.update({
      label: req.body.label,
      score: req.body.points,
      total_comments: req.body.totalComments,
      total_words: req.body.totalWords,
      total_tags: req.body.totalTags,
      total_chars: req.body.totalChars,
    }))
    .then(threshold => 
      Object.keys(req.body.customCriteria).map(id => {
        CriteriaCount.findOne({where: {
          criteria_id: id,
          grading_threshold_id: threshold.id
        }})
        .then(criteriaCount => {
          if(criteriaCount){
            return criteriaCount.update({
              num_annotations: req.body.customCriteria[id]
            });
          }
          else{
            return CriteriaCount.create({
              criteria_id: id,
              grading_threshold_id: threshold.id,
              num_annotations: req.body.customCriteria[id]
            });
          }
        });
      })
  )
  .then(() => {
    res.status(200).json(null);
  });
});


/**
 * Delete grading threshold of a class.
 * @name DELETE/api/grades/threshold
 * @param id: id of grading threshold
 */
router.delete('/threshold/:id', (req, res) => {
  GradingThreshold.destroy({where:{id: req.params.id}})
  .then(() => {
    res.status(200).json(null);
  });
});

/**
 * Create custom criteria for a grading system
 * @name POST/api/grades/criteria/:id
 * @param id: id of grading system
 */
router.post('/criteria/:id', (req, res) => {
  Criteria.create({
    label: req.body.label,
    num_tags: req.body.filters.HASHTAGS,
    num_words: req.body.filters.WORDS,
    num_chars: req.body.filters.CHARS,
    grading_system_id: req.params.id
  })
  .then(criteria => res.status(200).json(criteria))
});

/**
 * Edit custom criteria for a grading system
 * @name PUT/api/grades/criteria/:id
 * @param id: id of criteria
 */
router.put('/criteria/:id', (req, res) => {
  Criteria.findByPk(req.params.id).then(criteria => 
    criteria.update({
      label: req.body.label,
      num_tags: req.body.filters.HASHTAGS,
      num_words: req.body.filters.WORDS,
      num_chars: req.body.filters.CHARS
    }))
  .then(criteria => res.status(200).json(criteria))
});

/**
 * Delete custom criteria for a grading system
 * @name DELETE/api/grades/criteria/:id
 * @param id: id of criteria
 */
router.delete('/criteria/:id', (req, res) => {
  Criteria.destroy({where:{id: req.params.id}})
    .then(() => res.status(200).json(null));
});

/**
 * Generate grades for all students in current class for a given source and grading scheme
 * @name GET/api/grades/grades
 * @param sourceId: id of source file
 * @param gradingSystemId: id of gradingSystem 
 */
router.get('/grades', (req, res) => {
  Class.findByPk(req.session.classId, {include: 
    [
      {
        association: 'GlobalSection',
        include:[{
          association: 'MemberStudents',
          include:[{
            association: 'Annotations',
            include:[{
              association: 'Thread',
              include: [{
                association: 'Location',
                include: [{
                  association: 'Source',
                  where:{
                    id: req.query.sourceId
                  },
                  required: true
                }],
                required: true
              }],
            required: true
            }]
          }]
        }]
      }
    ]
}).then(nb_class => {
  res.status(200).json(nb_class.GlobalSection.MemberStudents);
});

});

module.exports = router;