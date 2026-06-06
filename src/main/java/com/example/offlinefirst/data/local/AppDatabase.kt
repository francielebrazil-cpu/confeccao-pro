package com.example.offlinefirst.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [ItemEntity::class, EmployeeEntity::class, ProductionEntryEntity::class, PartnerEntity::class, TransactionEntity::class], version = 3, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun itemDao(): ItemDao
    abstract fun productionDao(): ProductionDao
    abstract fun financeDao(): FinanceDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "item_database"
                )
                .fallbackToDestructiveMigration() // For development simplicity
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
