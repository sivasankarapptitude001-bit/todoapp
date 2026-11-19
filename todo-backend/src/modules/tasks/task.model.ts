import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model
} from "sequelize";
import { sequelize } from "../../config/database";

export class Task extends Model<InferAttributes<Task>, InferCreationAttributes<Task>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare name: string;
  declare completionDate: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id"
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    completionDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "completion_date"
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at"
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at"
    }
  },
  {
    sequelize,
    tableName: "tasks",
    underscored: true,
    timestamps: true
  }
);
