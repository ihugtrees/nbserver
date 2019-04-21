const bcrypt = require('bcrypt');

const user = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    id:{
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
  },
  {
    classMethods:{
      associate: (models) =>{
        User.hasMany(models.Class, {as: 'CreatedClasses', foreignKey: 'creator'});
        User.belongsToMany(models.Class, {as: 'InstructorClasses', through: 'instructors'});
        User.belongsToMany(models.Class, {as: 'TAClasses', through: 'class_tas'});
        User.belongsToMany(models.Section, {as: 'TASections', through: 'section_tas'});
        User.belongsToMany(models.Section, {as: 'MemberSections', through: 'student'});
        User.belongsToMany(models.Section, {as: 'InvitedSections', through: 'invited_students'});
        User.hasMany(models.Annotation, {as: 'Annotations', foreignKey:{name: 'author_id', allowNull: false}, onDelete:'CASCADE'});
        User.belongsToMany(models.Annotation, {as:'ReplyRequestedAnnotations', through:'reply_requests'});
        User.belongsToMany(models.Annotation, {as:'TaggedAnnotations', through:'user_tags'});
        User.belongsToMany(models.Annotation, {as:'BookmarkedAnnotations', through:'bookmarks'});
        User.belongsToMany(models.Annotation, {as:'StarredAnnotations', through:'stars'});
      }
    },
    hooks:{
      beforeCreate: (user) => {
        const salt = bcrypt.genSaltSync();
        user.password = bcrypt.hashSync(user.password, salt);
      }
    }
  }
  );
  User.prototype.validPassword = function(password){
    return bcrypt.compareSync(password, this.password);
  };
  return User;
};

module.exports = user;