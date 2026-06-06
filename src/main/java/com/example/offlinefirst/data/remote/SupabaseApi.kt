package com.example.offlinefirst.data.remote

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*

interface SupabaseApi {
    @GET("items?select=*")
    suspend fun getItems(): Response<List<ItemEntity>>

    @POST("items")
    suspend fun upsertItems(
        @Body items: List<ItemEntity>,
        @Header("Prefer") prefer: String = "resolution=merge-duplicates"
    ): Response<Unit>

    @PATCH("items")
    suspend fun updateItem(
        @Query("id") id: String,
        @Body item: ItemEntity
    ): Response<Unit>

    @DELETE("items")
    suspend fun deleteItem(
        @Query("id") id: String
    ): Response<Unit>

    companion object {
        fun create(): SupabaseApi {
            val logger = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY }

            val client = OkHttpClient.Builder()
                .addInterceptor(logger)
                .addInterceptor { chain ->
                    val request = chain.request().newBuilder()
                        .addHeader("apikey", SupabaseConfig.API_KEY)
                        .addHeader("Authorization", SupabaseConfig.AUTH_TOKEN)
                        .build()
                    chain.proceed(request)
                }
                .build()

            return Retrofit.Builder()
                .baseUrl(SupabaseConfig.BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(SupabaseApi::class.java)
        }
    }
}
