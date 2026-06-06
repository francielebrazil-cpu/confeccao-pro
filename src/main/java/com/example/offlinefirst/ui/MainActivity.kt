package com.example.offlinefirst.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.offlinefirst.data.local.ItemEntity
import com.example.offlinefirst.data.local.PartnerEntity
import com.example.offlinefirst.data.local.TransactionEntity
import com.example.offlinefirst.data.local.EmployeeEntity
import com.example.offlinefirst.data.local.DailyProductionReport

class MainActivity : ComponentActivity() {
    // In a real app, use Hilt or Koin for DI
    private lateinit var viewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize dependencies
        val db = com.example.offlinefirst.data.local.AppDatabase.getDatabase(this)
        val api = com.example.offlinefirst.data.remote.SupabaseApi.create()
        val repository = com.example.offlinefirst.data.repository.ItemRepository(db.itemDao(), api)
        val productionRepository = com.example.offlinefirst.data.repository.ProductionRepository(db.productionDao(), api)
        val financeRepository = com.example.offlinefirst.data.repository.FinanceRepository(db.financeDao(), api)
        val networkObserver = com.example.offlinefirst.util.NetworkObserver(this)
        val downloadHelper = com.example.offlinefirst.util.DownloadHelper(this)
        
        viewModel = MainViewModel(repository, productionRepository, financeRepository, networkObserver, downloadHelper)

        setContent {
            MaterialTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    MainScreen(viewModel)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(viewModel: MainViewModel) {
    val items by viewModel.items.collectAsStateWithLifecycle()
    val isOnline by viewModel.isOnline.collectAsStateWithLifecycle()
    val isSyncing by viewModel.isSyncing.collectAsStateWithLifecycle()
    val dailyReport by viewModel.dailyReport.collectAsStateWithLifecycle()
    val employees by viewModel.employees.collectAsStateWithLifecycle()
    val selectedDate by viewModel.selectedDate.collectAsStateWithLifecycle()
    val partners by viewModel.partners.collectAsStateWithLifecycle()
    val transactions by viewModel.transactions.collectAsStateWithLifecycle()
    
    var selectedTab by remember { mutableIntStateOf(0) }
    var showAddDialog by remember { mutableStateOf(false) }
    var showAddEmployeeDialog by remember { mutableStateOf(false) }
    var showAddProductionDialog by remember { mutableStateOf(false) }
    var showAddPartnerDialog by remember { mutableStateOf(false) }
    var showAddTransactionDialog by remember { mutableStateOf(false) }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Offline-First Supabase") },
                    actions = {
                        IconButton(onClick = { viewModel.sync() }, enabled = isOnline) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "Sync",
                                tint = if (isSyncing) Color.Gray else Color.White
                            )
                        }
                        IconButton(onClick = { 
                            viewModel.downloadReport("https://example.com/report.pdf", "report.pdf") 
                        }) {
                            Icon(imageVector = Icons.Default.FileDownload, contentDescription = "Download")
                        }
                    }
                )
            },
            bottomBar = {
                NavigationBar {
                    NavigationBarItem(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        icon = { Icon(Icons.Default.List, contentDescription = "Itens") },
                        label = { Text("Itens") }
                    )
                    NavigationBarItem(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        icon = { Icon(Icons.Default.CalendarToday, contentDescription = "Diária") },
                        label = { Text("Diária") }
                    )
                    NavigationBarItem(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        icon = { Icon(Icons.Default.People, contentDescription = "Parceiros") },
                        label = { Text("Parceiros") }
                    )
                    NavigationBarItem(
                        selected = selectedTab == 3,
                        onClick = { selectedTab = 3 },
                        icon = { Icon(Icons.Default.AccountBalanceWallet, contentDescription = "Financeiro") },
                        label = { Text("Financeiro") }
                    )
                }
            },
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) {
                Column(modifier = Modifier.fillMaxSize()) {
                    ConnectivityStatus(isOnline)
                    
                    when (selectedTab) {
                        0 -> {
                            LazyColumn(modifier = Modifier.fillMaxSize()) {
                                items(items) { item ->
                                    ItemRow(item, onDelete = { viewModel.deleteItem(item.id) })
                                }
                            }
                        }
                        1 -> {
                            DailyProductionScreen(
                                report = dailyReport,
                                selectedDate = selectedDate,
                                onDateChange = { viewModel.setSelectedDate(it) }
                            )
                        }
                        2 -> {
                            PartnersScreen(partners)
                        }
                        3 -> {
                            FinanceScreen(transactions)
                        }
                    }
                }

                // Manual FAB implementation for guaranteed visibility
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(bottom = 16.dp, end = 16.dp)
                ) {
                    when (selectedTab) {
                        0 -> {
                            FloatingActionButton(
                                onClick = { showAddDialog = true },
                                containerColor = MaterialTheme.colorScheme.primary
                            ) {
                                Icon(imageVector = Icons.Default.Add, contentDescription = "Add Item")
                            }
                        }
                        1 -> {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                ExtendedFloatingActionButton(
                                    onClick = { showAddEmployeeDialog = true },
                                    icon = { Icon(Icons.Filled.PersonAdd, contentDescription = null) },
                                    text = { Text("Funcionário") },
                                    containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                    contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                                )
                                ExtendedFloatingActionButton(
                                    onClick = { showAddProductionDialog = true },
                                    icon = { Icon(Icons.Default.Add, contentDescription = null) },
                                    text = { Text("Lançar Diária") },
                                    containerColor = MaterialTheme.colorScheme.primary,
                                    contentColor = MaterialTheme.colorScheme.onPrimary
                                )
                            }
                        }
                        2 -> {
                            ExtendedFloatingActionButton(
                                onClick = { showAddPartnerDialog = true },
                                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                                text = { Text("Novo Fornecedor") },
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        }
                        3 -> {
                            FloatingActionButton(
                                onClick = { showAddTransactionDialog = true },
                                containerColor = MaterialTheme.colorScheme.primary
                            ) {
                                Icon(imageVector = Icons.Default.Add, contentDescription = "Nova Transação")
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddItemDialog(
            onDismiss = { showAddDialog = false },
            onAdd = { name, desc -> 
                viewModel.addItem(name, desc)
                showAddDialog = false
            }
        )
    }

    if (showAddEmployeeDialog) {
        AddEmployeeDialog(
            onDismiss = { showAddEmployeeDialog = false },
            onAdd = { name, target ->
                viewModel.addEmployee(name, target)
                showAddEmployeeDialog = false
            }
        )
    }

    if (showAddProductionDialog) {
        AddProductionDialog(
            employees = employees,
            onDismiss = { showAddProductionDialog = false },
            onAdd = { employeeId, quantity, hours ->
                viewModel.addProductionEntry(employeeId, quantity, hours)
                showAddProductionDialog = false
            }
        )
    }

    if (showAddPartnerDialog) {
        AddPartnerDialog(
            onDismiss = { showAddPartnerDialog = false },
            onAdd = { name, type ->
                viewModel.addPartner(name, type)
                showAddPartnerDialog = false
            }
        )
    }

    if (showAddTransactionDialog) {
        AddTransactionDialog(
            partners = partners,
            employees = employees,
            onDismiss = { showAddTransactionDialog = false },
            onAdd = { desc, amt, date, partner, type ->
                viewModel.addTransaction(desc, amt, date, partner, type)
                showAddTransactionDialog = false
            },
            onAddNewPartner = {
                // Keep transaction dialog open or close and open partner?
                // User said "directly in the field", so maybe just a button to open partner dialog
                showAddPartnerDialog = true
            }
        )
    }
}

@Composable
fun PartnersScreen(partners: List<PartnerEntity>) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Parceiros", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn {
            items(partners) { partner ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (partner.type == "SUPPLIER") Icons.Default.Business else Icons.Default.Person,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(partner.name, style = MaterialTheme.typography.titleMedium)
                            Text(if (partner.type == "SUPPLIER") "Fornecedor" else "Cliente", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FinanceScreen(transactions: List<TransactionEntity>) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Financeiro", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn {
            items(transactions) { transaction ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(transaction.description, style = MaterialTheme.typography.titleMedium)
                            Text(transaction.partnerName, style = MaterialTheme.typography.bodySmall)
                            Text(transaction.date, style = MaterialTheme.typography.bodySmall)
                        }
                        Text(
                            text = "${if (transaction.type == "INCOME") "+" else "-"} R$ ${transaction.amount}",
                            color = if (transaction.type == "INCOME") Color(0xFF4CAF50) else Color.Red,
                            style = MaterialTheme.typography.titleLarge
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AddPartnerDialog(onDismiss: () -> Unit, onAdd: (String, String) -> Unit) {
    var name by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("SUPPLIER") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Novo Parceiro") },
        text = {
            Column {
                TextField(
                    value = name, 
                    onValueChange = { name = it }, 
                    label = { Text("Nome") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text("Tipo:", style = MaterialTheme.typography.labelLarge)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(selected = type == "SUPPLIER", onClick = { type = "SUPPLIER" })
                    Text("Fornecedor")
                    Spacer(modifier = Modifier.width(16.dp))
                    RadioButton(selected = type == "CLIENT", onClick = { type = "CLIENT" })
                    Text("Cliente")
                }
            }
        },
        confirmButton = {
            Button(onClick = { if (name.isNotBlank()) onAdd(name, type) }) { Text("Adicionar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

@Composable
fun AddTransactionDialog(
    partners: List<PartnerEntity>,
    employees: List<EmployeeEntity>,
    onDismiss: () -> Unit,
    onAdd: (String, Double, String, String, String) -> Unit,
    onAddNewPartner: () -> Unit
) {
    var description by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var selectedPartner by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("EXPENSE") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nova Transação") },
        text = {
            Column {
                TextField(
                    value = description, 
                    onValueChange = { description = it }, 
                    label = { Text("Descrição") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                TextField(
                    value = amount, 
                    onValueChange = { amount = it }, 
                    label = { Text("Valor (R$)") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                Text("Cliente/Funcionário/Fornecedor", style = MaterialTheme.typography.labelLarge)
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    TextField(
                        value = selectedPartner,
                        onValueChange = { selectedPartner = it },
                        modifier = Modifier.weight(1f),
                        label = { Text("Nome") }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    FilledIconButton(
                        onClick = onAddNewPartner,
                        colors = IconButtonDefaults.filledIconButtonColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Novo Parceiro")
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                Text("Tipo:", style = MaterialTheme.typography.labelLarge)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(selected = type == "INCOME", onClick = { type = "INCOME" })
                    Text("Receita")
                    Spacer(modifier = Modifier.width(16.dp))
                    RadioButton(selected = type == "EXPENSE", onClick = { type = "EXPENSE" })
                    Text("Despesa")
                }
            }
        },
        confirmButton = {
            Button(onClick = { 
                val amt = amount.toDoubleOrNull() ?: 0.0
                if (description.isNotBlank() && amt > 0) {
                    onAdd(description, amt, java.time.LocalDate.now().toString(), selectedPartner, type)
                }
            }) { Text("Salvar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

@Composable
fun DailyProductionScreen(
    report: List<DailyProductionReport>,
    selectedDate: String,
    onDateChange: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(
            text = "Relatório de Produção: $selectedDate",
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        
        if (report.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    text = "Nenhum funcionário cadastrado.\nUse o botão '+' para adicionar.",
                    textAlign = TextAlign.Center,
                    color = Color.Gray
                )
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(report) { entry ->
                    ProductionReportRow(entry)
                }
            }
        }
    }
}

@Composable
fun ProductionReportRow(entry: DailyProductionReport) {
    Card(modifier = Modifier.padding(vertical = 4.dp).fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = entry.employeeName, style = MaterialTheme.typography.titleMedium)
                EfficiencyBadge(entry.efficiency)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(text = "Produção", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(text = "${entry.totalQuantity ?: 0} peças", style = MaterialTheme.typography.bodyMedium)
                }
                Column {
                    Text(text = "Horas", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(text = "${entry.totalHours ?: 0.0}h", style = MaterialTheme.typography.bodyMedium)
                }
                Column {
                    Text(text = "Meta/h", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    Text(text = "${entry.targetPerHour} peças", style = MaterialTheme.typography.bodyMedium)
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = (entry.efficiency / 100.0).toFloat().coerceIn(0f, 1f),
                modifier = Modifier.fillMaxWidth().height(8.dp),
                color = if (entry.efficiency >= 100) Color(0xFF4CAF50) else Color(0xFFF44336),
                trackColor = Color.LightGray
            )
        }
    }
}

@Composable
fun EfficiencyBadge(efficiency: Double) {
    val color = when {
        efficiency >= 100 -> Color(0xFF4CAF50)
        efficiency >= 80 -> Color(0xFFFFC107)
        else -> Color(0xFFF44336)
    }
    
    Surface(
        color = color,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = "${efficiency.toInt()}%",
            color = Color.White,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
            style = MaterialTheme.typography.labelMedium
        )
    }
}

@Composable
fun AddEmployeeDialog(onDismiss: () -> Unit, onAdd: (String, Int) -> Unit) {
    var name by remember { mutableStateOf("") }
    var target by remember { mutableStateOf("10") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Novo Funcionário") },
        text = {
            Column {
                TextField(value = name, onValueChange = { name = it }, label = { Text("Nome") })
                TextField(value = target, onValueChange = { target = it }, label = { Text("Meta por Hora") })
            }
        },
        confirmButton = {
            Button(onClick = { onAdd(name, target.toIntOrNull() ?: 10) }) { Text("Adicionar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

@Composable
fun AddProductionDialog(
    employees: List<EmployeeEntity>,
    onDismiss: () -> Unit,
    onAdd: (String, Int, Double) -> Unit
) {
    var selectedEmployeeId by remember { mutableStateOf(employees.firstOrNull()?.id ?: "") }
    var quantity by remember { mutableStateOf("") }
    var hours by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Lançamento de Produção") },
        text = {
            Column {
                Text("Selecione o Funcionário:", style = MaterialTheme.typography.labelMedium)
                // Simplified dropdown for brevity
                employees.forEach { emp ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedEmployeeId == emp.id,
                            onClick = { selectedEmployeeId = emp.id }
                        )
                        Text(emp.name)
                    }
                }
                TextField(value = quantity, onValueChange = { quantity = it }, label = { Text("Quantidade") })
                TextField(value = hours, onValueChange = { hours = it }, label = { Text("Horas Trabalhadas") })
            }
        },
        confirmButton = {
            Button(onClick = { 
                onAdd(
                    selectedEmployeeId, 
                    quantity.toIntOrNull() ?: 0, 
                    hours.toDoubleOrNull() ?: 0.0
                ) 
            }) { Text("Lançar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

@Composable
fun ConnectivityStatus(isOnline: Boolean) {
    val color = if (isOnline) Color(0xFF4CAF50) else Color(0xFFF44336)
    val text = if (isOnline) "Online" else "Offline"
    
    Surface(color = color, modifier = Modifier.fillMaxWidth()) {
        Text(
            text = text,
            color = Color.White,
            modifier = Modifier.padding(4.dp),
            style = MaterialTheme.typography.labelSmall
        )
    }
}

@Composable
fun ItemRow(item: ItemEntity, onDelete: () -> Unit) {
    Card(modifier = Modifier.padding(8.dp).fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = item.name, style = MaterialTheme.typography.titleMedium)
                Text(text = item.description, style = MaterialTheme.typography.bodyMedium)
                if (!item.isSynced) {
                    Text(text = "Unsynced", color = Color.Red, style = MaterialTheme.typography.labelSmall)
                }
            }
            IconButton(onClick = onDelete) {
                Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete")
            }
        }
    }
}

@Composable
fun AddItemDialog(onDismiss: () -> Unit, onAdd: (String, String) -> Unit) {
    var name by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add New Item") },
        text = {
            Column {
                TextField(value = name, onValueChange = { name = it }, label = { Text("Name") })
                TextField(value = desc, onValueChange = { desc = it }, label = { Text("Description") })
            }
        },
        confirmButton = {
            Button(onClick = { onAdd(name, desc) }) { Text("Add") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
