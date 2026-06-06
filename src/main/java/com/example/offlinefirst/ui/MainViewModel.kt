package com.example.offlinefirst.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.offlinefirst.data.local.*
import com.example.offlinefirst.data.repository.ItemRepository
import com.example.offlinefirst.data.repository.ProductionRepository
import com.example.offlinefirst.util.DownloadHelper
import com.example.offlinefirst.util.NetworkObserver
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class MainViewModel(
    private val repository: ItemRepository,
    private val productionRepository: ProductionRepository,
    private val financeRepository: com.example.offlinefirst.data.repository.FinanceRepository,
    private val networkObserver: NetworkObserver,
    private val downloadHelper: DownloadHelper
) : ViewModel() {

    val items: StateFlow<List<ItemEntity>> = repository.allItems
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val isOnline: StateFlow<Boolean> = networkObserver.isOnline
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    // Production Logic
    private val _selectedDate = MutableStateFlow(LocalDate.now().format(DateTimeFormatter.ISO_DATE))
    val selectedDate: StateFlow<String> = _selectedDate.asStateFlow()

    val dailyReport: StateFlow<List<DailyProductionReport>> = _selectedDate
        .flatMapLatest { date -> productionRepository.getDailyReport(date) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val employees: StateFlow<List<EmployeeEntity>> = productionRepository.getAllEmployees()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Finance Logic
    val partners: StateFlow<List<PartnerEntity>> = financeRepository.allPartners
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val transactions: StateFlow<List<TransactionEntity>> = financeRepository.allTransactions
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun addPartner(name: String, type: String) {
        viewModelScope.launch {
            financeRepository.addPartner(name, type)
        }
    }

    fun addTransaction(description: String, amount: Double, date: String, partnerName: String, type: String) {
        viewModelScope.launch {
            financeRepository.addTransaction(description, amount, date, partnerName, type)
        }
    }

    fun setSelectedDate(date: String) {
        _selectedDate.value = date
    }

    fun addEmployee(name: String, target: Int) {
        viewModelScope.launch {
            productionRepository.addEmployee(name, target)
        }
    }

    fun addProductionEntry(employeeId: String, quantity: Int, hours: Double) {
        viewModelScope.launch {
            productionRepository.addProductionEntry(employeeId, quantity, hours, _selectedDate.value)
        }
    }

    fun addItem(name: String, description: String) {
        viewModelScope.launch {
            repository.addItem(name, description)
            if (isOnline.value) {
                sync()
            }
        }
    }

    fun deleteItem(id: String) {
        viewModelScope.launch {
            repository.deleteItem(id)
            if (isOnline.value) {
                sync()
            }
        }
    }

    fun sync() {
        viewModelScope.launch {
            _isSyncing.value = true
            repository.syncWithSupabase()
            _isSyncing.value = false
        }
    }

    fun downloadReport(url: String, fileName: String) {
        downloadHelper.downloadReport(url, fileName)
    }
}
