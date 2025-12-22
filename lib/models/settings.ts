import mongoose, { Schema, model, models } from "mongoose"

const SettingsSchema = new Schema(
  {
    storeName: {
      type: String,
      default: "My Store",
    },
    domain: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: null,
    },
    backgroundColor: {
      type: String,
      default: "#ffffff",
    },
    primaryColor: {
      type: String,
      default: "#3b82f6",
    },
    accentColor: {
      type: String,
      default: "#8b5cf6",
    },
    logoPublicId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({})
  }
  return settings
}

const Settings = models.Settings || model("Settings", SettingsSchema)

export default Settings
