import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const AMENITY_MAP: Record<string, string> = {
  'WiFi': 'wifi',
  '电源插座': 'power_outlet',
  '安静环境': 'quiet',
  '户外座位': 'outdoor_seating',
  '宠物友好': 'pet_friendly',
  '禁烟': 'no_smoking',
  '空调': 'air_conditioning',
  '提供停车位': 'parking',
  '无障碍通行（轮椅可进入）': 'wheelchair_accessible',
  '适合使用笔记本电脑': 'laptop_friendly',
  '适合团体聚会': 'group_friendly',
  '适合工作 / 办公': 'work_friendly',
}

const SPECIALTY_MAP: Record<string, string> = {
  '意式浓缩 Espresso': 'espresso',
  '手冲咖啡 Pour Over': 'pour_over',
  '冷萃咖啡 Cold Brew': 'cold_brew',
  '拉花咖啡 Latte Art': 'latte_art',
  '精品咖啡豆 Specialty Beans': 'specialty_beans',
  '甜点 Desserts': 'desserts',
  '轻食 Light Meals': 'light_meals',
}

const DAY_MAP: Record<string, string> = {
  '周一': 'monday',
  '周二': 'tuesday',
  '周三': 'wednesday',
  '周四': 'thursday',
  '周五': 'friday',
  '周六': 'saturday',
  '周日': 'sunday',
}

async function migrateEnums() {
  const db = mongoose.connection.db!
  const cafes = db.collection('cafes')
  const users = db.collection('users')

  // --- Cafe bulk write ---
  const allCafes = await cafes.find({}).toArray()
  const cafeBulk = allCafes.map((cafe: any) => ({
    updateOne: {
      filter: { _id: cafe._id },
      update: {
        $set: {
          amenities: (cafe.amenities || []).map((a: string) => AMENITY_MAP[a] ?? a),
          specialty: SPECIALTY_MAP[cafe.specialty] ?? cafe.specialty,
          openingHours: (cafe.openingHours || []).map((h: any) => ({
            ...h,
            day: DAY_MAP[h.day] ?? h.day
          }))
        }
      }
    }
  }))
  if (cafeBulk.length > 0) await cafes.bulkWrite(cafeBulk)
  console.log(`✅ Cafes updated: ${cafeBulk.length}`)

  // --- User bulk write ---
  const allUsers = await users.find({}).toArray()
  const userBulk = allUsers.map((user: any) => {
    const learned = user.preferences?.learned || {}
    const manual = user.preferences?.manual || {}

    // favoriteAmenities is [{amenity, weight}] — update the nested amenity field
    const newFavoriteAmenities = (learned.favoriteAmenities || []).map((entry: any) => ({
      ...entry,
      amenity: AMENITY_MAP[entry.amenity] ?? entry.amenity
    }))
    const newFavoriteSpecialties = (learned.favoriteSpecialties || []).map((s: string) => SPECIALTY_MAP[s] ?? s)
    const newMustHave = (manual.mustHaveAmenities || []).map((a: string) => AMENITY_MAP[a] ?? a)
    const newAvoid = (manual.avoidAmenities || []).map((a: string) => AMENITY_MAP[a] ?? a)

    return {
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            'preferences.learned.favoriteAmenities': newFavoriteAmenities,
            'preferences.learned.favoriteSpecialties': newFavoriteSpecialties,
            'preferences.manual.mustHaveAmenities': newMustHave,
            'preferences.manual.avoidAmenities': newAvoid,
          }
        }
      }
    }
  })
  if (userBulk.length > 0) await users.bulkWrite(userBulk)
  console.log(`✅ Users updated: ${userBulk.length}`)
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!)
  console.log('Connected to MongoDB')
  try {
    await migrateEnums()
    console.log('✅ Migration complete')
  } catch (err) {
    console.error('❌ Migration failed:', err)
  } finally {
    await mongoose.disconnect()
  }
}

main()
