from pathlib import Path

path = Path('src/App.tsx')
text = path.read_text(encoding='utf-8').replace('\r\n', '\n')
replacements = [
    (
        """// --- CRUD Handlers ---

READING

  const deleteClient = async (id: number) => {

    triggerConfirm('Excluir Cliente', 'Deseja realmente excluir este cliente?', async () => {

      await fetch(`/api/clients/${id}`, { method: 'DELETE' });

      fetchData();

      setSuccess('Cliente excluído com sucesso!');

    });

  };


  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
""",
        """// --- CRUD Handlers ---

  const saveClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    const clientData = {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      active: true
    };

    try {
      if (isSupabaseConfigured) {
        if (editingClient) {
          await supabaseUpdate<Client>('clients', clientData, editingClient.id);
        } else {
          await supabaseInsert<Client>('clients', clientData);
        }
        setIsClientModalOpen(false);
        setEditingClient(null);
        await fetchData();
        setSuccess('Cliente salvo com sucesso!');
        return;
      }

      const data = { ...clientData };
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const resData = await res.json();
      if (resData.success) {
        setIsClientModalOpen(false);
        setEditingClient(null);
        fetchData();
        setSuccess('Cliente salvo com sucesso!');
      } else {
        setError(resData.error || resData.message || 'Erro ao salvar cliente');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };


  const deleteClient = async (id: number) => {

    triggerConfirm('Excluir Cliente', 'Deseja realmente excluir este cliente?', async () => {
      try {
        if (isSupabaseConfigured) {
          await supabaseDelete('clients', id);
          await fetchData();
          setSuccess('Cliente excluído com sucesso!');
          return;
        }
        await fetch(`/api/clients/${id}`, { method: 'DELETE' });
        await fetchData();
        setSuccess('Cliente excluído com sucesso!');
      } catch (err) {
        setError('Erro ao excluir cliente');
      }
    });
  };


  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
"""
    ),
    (
        """  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;

    // Duplicate check
    const isDuplicate = products.some(p => 
      (p.name.toLowerCase() === name.toLowerCase() || (sku && p.sku && p.sku.toLowerCase() === sku.toLowerCase())) && 
      (!editingProduct || p.id !== editingProduct.id)
    );

    if (isDuplicate) {
      setError('Já existe um produto com este nome ou SKU.');
      return;
    }

    const data = {
      name,
      sku,
      category: formData.get('category') as string,
      technicalSheet: formData.get('technicalSheet') as string,
      photos: editingProduct?.photos || [],
      colors: editingProduct?.colors || [],
      sizes: editingProduct?.sizes || [],
      productionValue: Number(formData.get('productionValue')) || 0,
    };
    const url = editingProduct && editingProduct.id !== 0 ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct && editingProduct.id !== 0 ? 'PUT' : 'POST';
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (response.ok) {
      setIsProductModalOpen(false);
      setEditingProduct(null);
      await fetchData();
      setSuccess('Produto salvo com sucesso!');
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar produto');
    }
  };""",
        """  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;

    // Duplicate check
    const isDuplicate = products.some(p => 
      (p.name.toLowerCase() === name.toLowerCase() || (sku && p.sku && p.sku.toLowerCase() === sku.toLowerCase())) && 
      (!editingProduct || p.id !== editingProduct.id)
    );

    if (isDuplicate) {
      setError('Já existe um produto com este nome ou SKU.');
      return;
    }

    const data = {
      name,
      sku,
      category: formData.get('category') as string,
      technicalSheet: formData.get('technicalSheet') as string,
      photos: editingProduct?.photos || [],
      colors: editingProduct?.colors || [],
      sizes: editingProduct?.sizes || [],
      productionValue: Number(formData.get('productionValue')) || 0,
      active: editingProduct?.active ?? true
    };
    try {
      if (isSupabaseConfigured) {
        if (editingProduct && editingProduct.id !== 0) {
          await supabaseUpdate<Product>('products', data, editingProduct.id);
        } else {
          await supabaseInsert<Product>('products', data);
        }
        setIsProductModalOpen(false);
        setEditingProduct(null);
        await fetchData();
        setSuccess('Produto salvo com sucesso!');
        return;
      }

      const url = editingProduct && editingProduct.id !== 0 ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct && editingProduct.id !== 0 ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (response.ok) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        await fetchData();
        setSuccess('Produto salvo com sucesso!');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Erro ao salvar produto');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };"""
    ),
    (
        """  const deleteProduct = async (product: Product) => {
    triggerConfirm('Excluir Produto', `Deseja realmente excluir o produto "${product.name}"?`, async () => {

      try {

        const response = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });

        if (response.ok) {

          await fetchData();

          setSuccess('Produto excluído com sucesso!');

        } else {

          const data = await response.json();

          setError(data.error || 'Erro ao excluir produto');

        }

      } catch (err) {

        setError('Erro de conexão ao excluir produto');

      }

    });
  };""",
        """  const deleteProduct = async (product: Product) => {
    triggerConfirm('Excluir Produto', `Deseja realmente excluir o produto "${product.name}"?`, async () => {
      try {
        if (isSupabaseConfigured) {
          await supabaseDelete('products', product.id);
          await fetchData();
          setSuccess('Produto excluído com sucesso!');
          return;
        }
        const response = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchData();
          setSuccess('Produto excluído com sucesso!');
        } else {
          const data = await response.json();
          setError(data.error || 'Erro ao excluir produto');
        }
      } catch (err) {
        setError('Erro de conexão ao excluir produto');
      }
    });
  };"""
    ),
    (
        """  const saveProductionOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const description = formData.get('description') as string;

    let finalOrderItems = [...orderItems];
    
    // Se houver uma grade pendente que ainda não foi adicionada aos itens da ordem
    if (selectedProductIdForOrder && itemsBreakdown.length > 0) {
      const product = products.find(p => p.id === selectedProductIdForOrder);
      if (product) {
        const newItem: OrderItem = {
          productId: product.id,
          productName: product.name,
          quantity: itemsBreakdown.reduce((acc, i) => acc + i.quantity, 0),
          itemsBreakdown: [...itemsBreakdown],
          unitPrice: product.productionValue || 0
        };
        finalOrderItems.push(newItem);
        // Limpa os estados pendentes
        setItemsBreakdown([]);
        setSelectedProductIdForOrder(null);
      }
    }

    if (finalOrderItems.length === 0) {
      setError('Adicione pelo menos um produto com grade à ordem de produção.');
      return;
    }

    const data = {
      description,
      clientId: Number(formData.get('clientId')) || null,
      items: finalOrderItems,
      totalPieces: finalOrderItems.reduce((acc, item) => acc + item.quantity, 0),
      unitPrice: Number(formData.get('unitPrice')) || 0,
      totalValue: Number(formData.get('totalValue')) || 0,
      status: formData.get('status') as string,
      priority: formData.get('priority') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || null,
    };
    const url = editingProductionOrder ? `/api/production-orders/${editingProductionOrder.id}` : '/api/production-orders';
    const method = editingProductionOrder ? 'PUT' : 'POST';
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (response.ok) {
      const savedOrder = await response.json();
      setIsProductionOrderModalOpen(false);
      
      // Check if status is completed to offer financial launch
      if (data.status === 'completed' && (!editingProductionOrder || editingProductionOrder.status !== 'completed')) {
        setPendingFinanceOrder({ ...data, id: editingProductionOrder?.id || savedOrder.id } as ProductionOrder);
        setIsOrderFinanceModalOpen(true);
      }
      
      setEditingProductionOrder(null);
      await fetchData();
      setSuccess('Ordem de produção salva com sucesso!');
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar ordem de produção');
    }
  };""",
        """  const saveProductionOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const description = formData.get('description') as string;

    let finalOrderItems = [...orderItems];
    
    // Se houver uma grade pendente que ainda não foi adicionada aos itens da ordem
    if (selectedProductIdForOrder && itemsBreakdown.length > 0) {
      const product = products.find(p => p.id === selectedProductIdForOrder);
      if (product) {
        const newItem: OrderItem = {
          productId: product.id,
          productName: product.name,
          quantity: itemsBreakdown.reduce((acc, i) => acc + i.quantity, 0),
          itemsBreakdown: [...itemsBreakdown],
          unitPrice: product.productionValue || 0
        };
        finalOrderItems.push(newItem);
        // Limpa os estados pendentes
        setItemsBreakdown([]);
        setSelectedProductIdForOrder(null);
      }
    }

    if (finalOrderItems.length === 0) {
      setError('Adicione pelo menos um produto com grade à ordem de produção.');
      return;
    }

    const data = {
      description,
      clientId: Number(formData.get('clientId')) || null,
      items: finalOrderItems,
      totalPieces: finalOrderItems.reduce((acc, item) => acc + item.quantity, 0),
      unitPrice: Number(formData.get('unitPrice')) || 0,
      totalValue: Number(formData.get('totalValue')) || 0,
      status: formData.get('status') as string,
      priority: formData.get('priority') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || null,
    };
    try {
      if (isSupabaseConfigured) {
        let savedOrder: ProductionOrder | null = null;
        if (editingProductionOrder) {
          const updated = await supabaseUpdate<ProductionOrder>('production_orders', data, editingProductionOrder.id);
          savedOrder = Array.isArray(updated) ? updated[0] : null;
        } else {
          const inserted = await supabaseInsert<ProductionOrder>('production_orders', data);
          savedOrder = Array.isArray(inserted) ? inserted[0] : null;
        }

        setIsProductionOrderModalOpen(false);

        if (data.status === 'completed' && (!editingProductionOrder || editingProductionOrder.status !== 'completed')) {
          setPendingFinanceOrder({ ...data, id: editingProductionOrder?.id || savedOrder?.id || 0 } as ProductionOrder);
          setIsOrderFinanceModalOpen(true);
        }

        setEditingProductionOrder(null);
        await fetchData();
        setSuccess('Ordem de produção salva com sucesso!');
        return;
      }

      const url = editingProductionOrder ? `/api/production-orders/${editingProductionOrder.id}` : '/api/production-orders';
      const method = editingProductionOrder ? 'PUT' : 'POST';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (response.ok) {
        const savedOrder = await response.json();
        setIsProductionOrderModalOpen(false);
        
        if (data.status === 'completed' && (!editingProductionOrder || editingProductionOrder.status !== 'completed')) {
          setPendingFinanceOrder({ ...data, id: editingProductionOrder?.id || savedOrder.id } as ProductionOrder);
          setIsOrderFinanceModalOpen(true);
        }
        
        setEditingProductionOrder(null);
        await fetchData();
        setSuccess('Ordem de produção salva com sucesso!');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Erro ao salvar ordem de produção');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };"""
    ),
    (
        """  const toggleProductionStatus = async (order: ProductionOrder) => {
    const nextStatus = order.status === 'completed' ? 'planning' : 'completed';
    const nextStatusLabel = statusLabels[nextStatus];
    const productNames = order.items?.map(i => i.productName).join(', ');
    const newDescription = productNames ? `${productNames} - ${nextStatusLabel}` : nextStatusLabel;


    try {

      const response = await fetch(`/api/production-orders/${order.id}`, {

        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          ...order,

          status: nextStatus,

          description: newDescription,

          endDate: nextStatus === 'completed' ? new Date().toLocaleDateString('en-CA') : null

        })

      });
      if (response.ok) {
        await fetchData();
        setSuccess(`Ordem "${newDescription}" marcada como ${nextStatus === 'completed' ? 'Finalizada' : 'Pendente'}.`);
        if (nextStatus === 'completed') {
          setPendingFinanceOrder({ ...order, status: 'completed', description: newDescription } as ProductionOrder);
          setIsOrderFinanceModalOpen(true);
        }
      }
    } catch (err) {
      setError('Erro ao alterar status');
    }
  };""",
        """  const toggleProductionStatus = async (order: ProductionOrder) => {
    const nextStatus = order.status === 'completed' ? 'planning' : 'completed';
    const nextStatusLabel = statusLabels[nextStatus];
    const productNames = order.items?.map(i => i.productName).join(', ');
    const newDescription = productNames ? `${productNames} - ${nextStatusLabel}` : nextStatusLabel;


    try {
      if (isSupabaseConfigured) {
        await supabaseUpdate<ProductionOrder>('production_orders', {
          ...order,
          status: nextStatus,
          description: newDescription,
          endDate: nextStatus === 'completed' ? new Date().toLocaleDateString('en-CA') : null
        }, order.id);
        await fetchData();
        setSuccess(`Ordem "${newDescription}" marcada como ${nextStatus === 'completed' ? 'Finalizada' : 'Pendente'}.`);
        if (nextStatus === 'completed') {
          setPendingFinanceOrder({ ...order, status: 'completed', description: newDescription } as ProductionOrder);
          setIsOrderFinanceModalOpen(true);
        }
        return;
      }

      const response = await fetch(`/api/production-orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...order,
          status: nextStatus,
          description: newDescription,
          endDate: nextStatus === 'completed' ? new Date().toLocaleDateString('en-CA') : null
        })
      });
      if (response.ok) {
        await fetchData();
        setSuccess(`Ordem "${newDescription}" marcada como ${nextStatus === 'completed' ? 'Finalizada' : 'Pendente'}.`);
        if (nextStatus === 'completed') {
          setPendingFinanceOrder({ ...order, status: 'completed', description: newDescription } as ProductionOrder);
          setIsOrderFinanceModalOpen(true);
        }
      }
    } catch (err) {
      setError('Erro ao alterar status');
    }
  };"""
    ),
    (
        """  const deleteProductionOrder = async (id: number) => {
    triggerConfirm('Excluir Ordem de Produção', 'Deseja excluir esta ordem de produção? Todas as etapas relacionadas também serão excluídas.', async () => {
      const response = await fetch(`/api/production-orders/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
        setSuccess('Ordem de produção excluída!');
      }
    });
  };""",
        """  const deleteProductionOrder = async (id: number) => {
    triggerConfirm('Excluir Ordem de Produção', 'Deseja excluir esta ordem de produção? Todas as etapas relacionadas também serão excluídas.', async () => {
      try {
        if (isSupabaseConfigured) {
          await supabaseDelete('production_orders', id);
          await fetchData();
          setSuccess('Ordem de produção excluída!');
          return;
        }
        const response = await fetch(`/api/production-orders/${id}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchData();
          setSuccess('Ordem de produção excluída!');
        }
      } catch (err) {
        setError('Erro ao excluir ordem de produção');
      }
    });
  };"""
    ),
    (
        """  const saveProductionStep = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      orderId: Number(formData.get('orderId')),
      employeeId: Number(formData.get('employeeId')),
      stepType: formData.get('stepType') as string,
      quantity: Number(formData.get('quantity')),
      date: formData.get('date') as string,
    };
    const response = await fetch('/api/production-steps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (response.ok) {
      setIsProductionStepModalOpen(false);
      await fetchData();
      setSuccess('Produção lançada com sucesso!');
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar etapa de produção');
    }

  };""",
        """  const saveProductionStep = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      orderId: Number(formData.get('orderId')),
      employeeId: Number(formData.get('employeeId')),
      stepType: formData.get('stepType') as string,
      quantity: Number(formData.get('quantity')),
      date: formData.get('date') as string,
    };
    try {
      if (isSupabaseConfigured) {
        await supabaseInsert<ProductionStep>('production_steps', data);
        setIsProductionStepModalOpen(false);
        await fetchData();
        setSuccess('Produção lançada com sucesso!');
        return;
      }

      const response = await fetch('/api/production-steps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (response.ok) {
        setIsProductionStepModalOpen(false);
        await fetchData();
        setSuccess('Produção lançada com sucesso!');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Erro ao salvar etapa de produção');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }

  };"""
    ),
    (
        """  const deleteProductionStep = async (id: number) => {
    triggerConfirm('Excluir Lançamento', 'Deseja excluir este lançamento de produção?', async () => {
      const response = await fetch(`/api/production-steps/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
        setSuccess('Lançamento excluído!');
      }
    });
  };""",
        """  const deleteProductionStep = async (id: number) => {
    triggerConfirm('Excluir Lançamento', 'Deseja excluir este lançamento de produção?', async () => {
      try {
        if (isSupabaseConfigured) {
          await supabaseDelete('production_steps', id);
          await fetchData();
          setSuccess('Lançamento excluído!');
          return;
        }
        const response = await fetch(`/api/production-steps/${id}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchData();
          setSuccess('Lançamento excluído!');
        }
      } catch (err) {
        setError('Erro ao excluir lançamento de produção');
      }
    });
  };"""
    ),
    (
        """  const saveTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const amountStr = (formData.get('amount') as string).replace(',', '.');
    const amount = parseFloat(amountStr);

    if (isNaN(amount)) {
      setError('Valor inválido. Use números (ex: 10.50 ou 10,50)');
      return;
    }

    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const type = formData.get('type') as string;

    
    // Duplicate check: same description, amount, date and type
    const isDuplicate = transactions.some(t => 
      t.description.toLowerCase() === description.toLowerCase() && 
      t.amount === amount && 
      t.date === date && 
      t.type === type &&
      (!editingTransaction || t.id !== editingTransaction.id)
    );

    if (isDuplicate) {
      setError('Já existe uma transação idêntica (mesma descrição, valor, data e tipo) registrada.');
      return;
    }

    const status = formData.get('status') as 'pending' | 'partial' | 'completed';
    const isRecurringCheck = formData.get('isRecurring') === 'true';
    const recurrencePeriod = formData.get('recurrencePeriod') as 'monthly' | 'weekly' | 'daily';
    const recurrenceCount = Number(formData.get('recurrenceCount') || 1);

    const baseData = {
      type,
      category: formData.get('category') as string,
      amount: amount,
      paidAmount: editingTransaction ? editingTransaction.paidAmount : (status === 'completed' ? amount : 0),
      date,
      description,
      clientName: formData.get('clientName') as string || null,
      relatedId: formData.get('relatedId') ? Number(formData.get('relatedId')) : null,
      status,
      dueDate: formData.get('dueDate') as string || null,
      finishedDate: status === 'completed' ? (editingTransaction?.finishedDate || new Date().toLocaleDateString('en-CA')) : null,
      reconciled: formData.get('reconciled') === 'true',
      isRecurring: isRecurringCheck,
      recurrencePeriod: isRecurringCheck ? recurrencePeriod : null,
      recurrenceCount: isRecurringCheck ? recurrenceCount : null
    };

    if (!editingTransaction && isRecurringCheck && recurrenceCount > 1) {
      // Create multiple transactions
      const promises = [];
      for (let i = 0; i < recurrenceCount; i++) {
        const nextDate = (dateStr: string, period: string, index: number) => {
          const d = new Date(dateStr + 'T12:00:00');
          if (period === 'monthly') d.setMonth(d.getMonth() + index);
          else if (period === 'weekly') d.setDate(d.getDate() + (index * 7));
          else if (period === 'daily') d.setDate(d.getDate() + index);
          return d.toISOString().split('T')[0];
        };

        const currentDueDate = baseData.dueDate ? nextDate(baseData.dueDate, recurrencePeriod, i) : null;
        const currentDate = nextDate(baseData.date, recurrencePeriod, i);
        
        const installmentData = {
          ...baseData,
          date: currentDate,
          dueDate: currentDueDate,
          description: `${description} (${i + 1}/${recurrenceCount})`,
          // Only the first one can be completed if set that way, or all? 
          // Usually fixed expenses are created as pending for future months.
          status: i === 0 ? status : 'pending',
          paidAmount: i === 0 ? baseData.paidAmount : 0,
          finishedDate: i === 0 ? baseData.finishedDate : null,
          reconciled: i === 0 ? baseData.reconciled : false
        };

        promises.push(fetch('/api/financial-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(installmentData)
        }));
      }

      const results = await Promise.all(promises);
      if (results.every(r => r.ok)) {
        setIsFinanceModalOpen(false);
        await fetchData();
        setSuccess(`${recurrenceCount} transações geradas com sucesso!`);
      } else {
        setError('Erro ao gerar algumas transações recorrentes');
      }
      return;
    }

    const url = editingTransaction ? `/api/financial-transactions/${editingTransaction.id}` : '/api/financial-transactions';
    const method = editingTransaction ? 'PUT' : 'POST';

    const response = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(baseData) 
    });

    if (response.ok) {
      setIsFinanceModalOpen(false);
      setEditingTransaction(null);
      await fetchData();
      setSuccess('Transação salva com sucesso!');
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar transação');
    }
  };""",
        """  const saveTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const amountStr = (formData.get('amount') as string).replace(',', '.');
    const amount = parseFloat(amountStr);

    if (isNaN(amount)) {
      setError('Valor inválido. Use números (ex: 10.50 ou 10,50)');
      return;
    }

    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const type = formData.get('type') as string;

    
    // Duplicate check: same description, amount, date and type
    const isDuplicate = transactions.some(t => 
      t.description.toLowerCase() === description.toLowerCase() && 
      t.amount === amount && 
      t.date === date && 
      t.type === type &&
      (!editingTransaction || t.id !== editingTransaction.id)
    );

    if (isDuplicate) {
      setError('Já existe uma transação idêntica (mesma descrição, valor, data e tipo) registrada.');
      return;
    }

    const status = formData.get('status') as 'pending' | 'partial' | 'completed';
    const isRecurringCheck = formData.get('isRecurring') === 'true';
    const recurrencePeriod = formData.get('recurrencePeriod') as 'monthly' | 'weekly' | 'daily';
    const recurrenceCount = Number(formData.get('recurrenceCount') || 1);

    const baseData = {
      type,
      category: formData.get('category') as string,
      amount: amount,
      paidAmount: editingTransaction ? editingTransaction.paidAmount : (status === 'completed' ? amount : 0),
      date,
      description,
      clientName: formData.get('clientName') as string || null,
      relatedId: formData.get('relatedId') ? Number(formData.get('relatedId')) : null,
      status,
      dueDate: formData.get('dueDate') as string || null,
      finishedDate: status === 'completed' ? (editingTransaction?.finishedDate || new Date().toLocaleDateString('en-CA')) : null,
      reconciled: formData.get('reconciled') === 'true',
      isRecurring: isRecurringCheck,
      recurrencePeriod: isRecurringCheck ? recurrencePeriod : null,
      recurrenceCount: isRecurringCheck ? recurrenceCount : null
    };

    if (!editingTransaction && isRecurringCheck && recurrenceCount > 1) {
      const installmentData = [] as any[];
      const nextDate = (dateStr: string, period: string, index: number) => {
        const d = new Date(dateStr + 'T12:00:00');
        if (period === 'monthly') d.setMonth(d.getMonth() + index);
        else if (period === 'weekly') d.setDate(d.getDate() + (index * 7));
        else if (period === 'daily') d.setDate(d.getDate() + index);
        return d.toISOString().split('T')[0];
      };

      for (let i = 0; i < recurrenceCount; i++) {
        const currentDueDate = baseData.dueDate ? nextDate(baseData.dueDate, recurrencePeriod, i) : null;
        const currentDate = nextDate(baseData.date, recurrencePeriod, i);
        installmentData.push({
          ...baseData,
          date: currentDate,
          dueDate: currentDueDate,
          description: `${description} (${i + 1}/${recurrenceCount})`,
          status: i === 0 ? status : 'pending',
          paidAmount: i === 0 ? baseData.paidAmount : 0,
          finishedDate: i === 0 ? baseData.finishedDate : null,
          reconciled: i === 0 ? baseData.reconciled : false
        });
      }

      try {
        if (isSupabaseConfigured) {
          await supabaseInsert<FinancialTransaction>('financial_transactions', installmentData);
          setIsFinanceModalOpen(false);
          await fetchData();
          setSuccess(`${recurrenceCount} transações geradas com sucesso!`);
          return;
        }

        const promises = installmentData.map(data => fetch('/api/financial-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }));

        const results = await Promise.all(promises);
        if (results.every(r => r.ok)) {
          setIsFinanceModalOpen(false);
          await fetchData();
          setSuccess(`${recurrenceCount} transações geradas com sucesso!`);
        } else {
          setError('Erro ao gerar algumas transações recorrentes');
        }
      } catch (err) {
        setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
      }
      return;
    }

    try {
      if (isSupabaseConfigured) {
        if (editingTransaction) {
          await supabaseUpdate<FinancialTransaction>('financial_transactions', baseData, editingTransaction.id);
        } else {
          await supabaseInsert<FinancialTransaction>('financial_transactions', baseData);
        }
        setIsFinanceModalOpen(false);
        setEditingTransaction(null);
        await fetchData();
        setSuccess('Transação salva com sucesso!');
        return;
      }

      const url = editingTransaction ? `/api/financial-transactions/${editingTransaction.id}` : '/api/financial-transactions';
      const method = editingTransaction ? 'PUT' : 'POST';
      const response = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(baseData) 
      });

      if (response.ok) {
        setIsFinanceModalOpen(false);
        setEditingTransaction(null);
        await fetchData();
        setSuccess('Transação salva com sucesso!');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Erro ao salvar transação');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };"""
    ),
    (
        """  const updateTransactionStatus = async (transaction: FinancialTransaction, newStatus: 'pending' | 'partial' | 'completed', paymentAmount?: number) => {
    const updatedPaidAmount = (transaction.paidAmount || 0) + (paymentAmount || 0);
    const finalStatus = paymentAmount ? (updatedPaidAmount >= transaction.amount ? 'completed' : 'partial') : newStatus;
    
    
    const response = await fetch(`/api/financial-transactions/${transaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...transaction, 
        status: finalStatus,
        finishedDate: finalStatus === 'completed' ? new Date().toLocaleDateString('en-CA') : transaction.finishedDate,
        paidAmount: paymentAmount ? updatedPaidAmount : (newStatus === 'completed' ? transaction.amount : transaction.paidAmount)
      })
    });
    if (response.ok) {
      await fetchData();
    }
  };""",
        """  const updateTransactionStatus = async (transaction: FinancialTransaction, newStatus: 'pending' | 'partial' | 'completed', paymentAmount?: number) => {
    const updatedPaidAmount = (transaction.paidAmount || 0) + (paymentAmount || 0);
    const finalStatus = paymentAmount ? (updatedPaidAmount >= transaction.amount ? 'completed' : 'partial') : newStatus;
    
    try {
      if (isSupabaseConfigured) {
        await supabaseUpdate<FinancialTransaction>('financial_transactions', {
          ...transaction,
          status: finalStatus,
          finishedDate: finalStatus === 'completed' ? new Date().toLocaleDateString('en-CA') : transaction.finishedDate,
          paidAmount: paymentAmount ? updatedPaidAmount : (newStatus === 'completed' ? transaction.amount : transaction.paidAmount)
        }, transaction.id);
        await fetchData();
        return;
      }

      const response = await fetch(`/api/financial-transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...transaction, 
          status: finalStatus,
          finishedDate: finalStatus === 'completed' ? new Date().toLocaleDateString('en-CA') : transaction.finishedDate,
          paidAmount: paymentAmount ? updatedPaidAmount : (newStatus === 'completed' ? transaction.amount : transaction.paidAmount)
        })
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };"""
    ),
    (
        """  const toggleReconciliation = async (transaction: FinancialTransaction) => {
    const response = await fetch(`/api/financial-transactions/${transaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...transaction, reconciled: !transaction.reconciled })
    });
    if (response.ok) {
      await fetchData();
    }
  };""",
        """  const toggleReconciliation = async (transaction: FinancialTransaction) => {
    try {
      if (isSupabaseConfigured) {
        await supabaseUpdate<FinancialTransaction>('financial_transactions', { ...transaction, reconciled: !transaction.reconciled }, transaction.id);
        await fetchData();
        return;
      }

      const response = await fetch(`/api/financial-transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...transaction, reconciled: !transaction.reconciled })
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };"""
    ),
    (
        """  const deleteTransaction = async (id: number) => {
    triggerConfirm('Excluir Transação', 'Deseja realmente excluir esta transação?', async () => {
      const response = await fetch(`/api/financial-transactions/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
        setSuccess('Transação excluída!');
      }
    });
  };""",
        """  const deleteTransaction = async (id: number) => {
    triggerConfirm('Excluir Transação', 'Deseja realmente excluir esta transação?', async () => {
      try {
        if (isSupabaseConfigured) {
          await supabaseDelete('financial_transactions', id);
          await fetchData();
          setSuccess('Transação excluída!');
          return;
        }
        const response = await fetch(`/api/financial-transactions/${id}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchData();
          setSuccess('Transação excluída!');
        }
      } catch (err) {
        setError('Erro ao excluir transação');
      }
    });
  };"""
    ),
    (
        """  const reverseTransaction = async (transaction: FinancialTransaction) => {
    triggerConfirm(
      'Estornar Transação', 
      'Deseja realmente estornar este pagamento/recebimento? O valor pago será zerado e a conta voltará para pendente.', 
      async () => {
        const response = await fetch(`/api/financial-transactions/${transaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...transaction, 
            status: 'pending',
            paidAmount: 0
          })
        });
        if (response.ok) {
          await fetchData();
          setSuccess('Transação estornada com sucesso!');
        }
      },
      'Estornar',
      'bg-emerald-600'
    );
  };""",
        """  const reverseTransaction = async (transaction: FinancialTransaction) => {
    triggerConfirm(
      'Estornar Transação', 
      'Deseja realmente estornar este pagamento/recebimento? O valor pago será zerado e a conta voltará para pendente.', 
      async () => {
        try {
          if (isSupabaseConfigured) {
            await supabaseUpdate<FinancialTransaction>('financial_transactions', { ...transaction, status: 'pending', paidAmount: 0 }, transaction.id);
            await fetchData();
            setSuccess('Transação estornada com sucesso!');
            return;
          }
          const response = await fetch(`/api/financial-transactions/${transaction.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ...transaction, 
              status: 'pending',
              paidAmount: 0
            })
          });
          if (response.ok) {
            await fetchData();
            setSuccess('Transação estornada com sucesso!');
          }
        } catch (err) {
          setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
        }
      },
      'Estornar',
      'bg-emerald-600'
    );
  };"""
    ),
    (
        """  const saveEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const dailyRate = Number(formData.get('dailyRate'));
    const cpf = formData.get('cpf') as string;
    const address = formData.get('address') as string;
    const pix_key = formData.get('pix_key') as string;


    // Duplicate check
    const isDuplicate = employees.some(emp => 
      emp.name.toLowerCase() === name.toLowerCase() && 
      (!editingEmployee || emp.id !== editingEmployee.id)
    );


    if (isDuplicate) {
      setError('Já existe um funcionário com este nome.');
      return;
    }


    const employeeData = {
      name,
      role,
      dailyRate,
      cpf,
      address,
      pix_key
    };


    const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
    const method = editingEmployee ? 'PUT' : 'POST';


    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    });


    if (response.ok) {
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);
      await fetchData();
    } else {
      const errData = await response.json();
      setError(errData.error || 'Erro ao salvar funcionário');
    }
  };""",
        """  const saveEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const dailyRate = Number(formData.get('dailyRate'));
    const cpf = formData.get('cpf') as string;
    const address = formData.get('address') as string;
    const pix_key = formData.get('pix_key') as string;

    // Duplicate check
    const isDuplicate = employees.some(emp => 
      emp.name.toLowerCase() === name.toLowerCase() && 
      (!editingEmployee || emp.id !== editingEmployee.id)
    );

    if (isDuplicate) {
      setError('Já existe um funcionário com este nome.');
      return;
    }

    const employeeData = {
      name,
      role,
      dailyRate,
      cpf,
      address,
      pix_key
    };

    try {
      if (isSupabaseConfigured) {
        if (editingEmployee) {
          await supabaseUpdate<Employee>('employees', employeeData, editingEmployee.id);
        } else {
          await supabaseInsert<Employee>('employees', employeeData);
        }
        setIsEmployeeModalOpen(false);
        setEditingEmployee(null);
        await fetchData();
        return;
      }

      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
      });
      if (response.ok) {
        setIsEmployeeModalOpen(false);
        setEditingEmployee(null);
        await fetchData();
      } else {
        const errData = await response.json();
        setError(errData.error || 'Erro ao salvar funcionário');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };"""
    ),
    (
        """  const deleteEmployee = async (id: number) => {
    triggerConfirm('Excluir Funcionário', 'Deseja realmente excluir este funcionário?', async () => {
      try {
        const res = await fetch(`/api/employees/${id}`, { 
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erro ao excluir funcionário do servidor');
        }
        
        await fetchData();
        setSuccess('Funcionário excluído!');
      } catch (err) {
        setError('Não foi possível excluir o funcionário: ' + (err as Error).message);
      }
    });
  };""",
        """  const deleteEmployee = async (id: number) => {
    triggerConfirm('Excluir Funcionário', 'Deseja realmente excluir este funcionário?', async () => {
      try {
        if (isSupabaseConfigured) {
          await supabaseDelete('employees', id);
          await fetchData();
          setSuccess('Funcionário excluído!');
          return;
        }

        const res = await fetch(`/api/employees/${id}`, { 
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erro ao excluir funcionário do servidor');
        }
        await fetchData();
        setSuccess('Funcionário excluído!');
      } catch (err) {
        setError('Não foi possível excluir o funcionário: ' + (err as Error).message);
      }
    });
  };"""
    ),
    (
        """  const saveShift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const employeeId = Number(formData.get('employeeId'));
    const date = formData.get('date') as string;


    // Duplicate check: same employee, same date
    const isDuplicate = shifts.some(s => 
      s.employeeId === employeeId && 
      s.date === date && 
      (!editingShift || s.id !== editingShift.id)
    );


    if (isDuplicate) {
      setError('Este funcionário já possui uma diária registrada para esta data.');
      return;
    }


    const data = {
      employeeId,
      date,
      amount: Number(formData.get('amount')),
      status: editingShift ? editingShift.status : 'pending',
      notes: formData.get('notes') as string,
      isHalfDay: formData.get('isHalfDay') === 'on',
      hoursWorked: formData.get('hoursWorked') ? Number(formData.get('hoursWorked')) : null,
    };


    const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts';
    const method = editingShift ? 'PUT' : 'POST';


    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });


    setIsShiftModalOpen(false);
    setEditingShift(null);
    fetchData();
  };""",
        """  const saveShift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const employeeId = Number(formData.get('employeeId'));
    const date = formData.get('date') as string;

    // Duplicate check: same employee, same date
    const isDuplicate = shifts.some(s => 
      s.employeeId === employeeId && 
      s.date === date && 
      (!editingShift || s.id !== editingShift.id)
    );

    if (isDuplicate) {
      setError('Este funcionário já possui uma diária registrada para esta data.');
      return;
    }

    const data = {
      employeeId,
      date,
      amount: Number(formData.get('amount')),
      status: editingShift ? editingShift.status : 'pending',
      notes: formData.get('notes') as string,
      isHalfDay: formData.get('isHalfDay') === 'on',
      hoursWorked: formData.get('hoursWorked') ? Number(formData.get('hoursWorked')) : null,
    };

    try {
      if (isSupabaseConfigured) {
        if (editingShift) {
          await supabaseUpdate<DailyShift>('shifts', data, editingShift.id);
        } else {
          await supabaseInsert<DailyShift>('shifts', data);
        }
        setIsShiftModalOpen(false);
        setEditingShift(null);
        await fetchData();
        return;
      }

      const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts';
      const method = editingShift ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      setIsShiftModalOpen(false);
      setEditingShift(null);
      fetchData();
    } catch (err) {
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };"""
    ),
    (
        """  const bulkDeleteShifts = async () => {
    if (selectedShifts.length === 0) return;
    
    try {
      const res = await fetch('/api/shifts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedShifts })
      });
      if (res.ok) {
        setSelectedShifts([]);
        fetchData();
        setSuccess('Registros excluídos com sucesso!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Erro retornado pelo servidor na exclusão em massa:', errorData);
        setError('Erro ao excluir registros: ' + (errorData.message || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro na exclusão em massa:', err);
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };""",
        """  const bulkDeleteShifts = async () => {
    if (selectedShifts.length === 0) return;
    
    try {
      if (isSupabaseConfigured) {
        await supabaseDeleteMany('shifts', selectedShifts);
        setSelectedShifts([]);
        await fetchData();
        setSuccess('Registros excluídos com sucesso!');
        return;
      }

      const res = await fetch('/api/shifts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedShifts })
      });
      if (res.ok) {
        setSelectedShifts([]);
        fetchData();
        setSuccess('Registros excluídos com sucesso!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Erro retornado pelo servidor na exclusão em massa:', errorData);
        setError('Erro ao excluir registros: ' + (errorData.message || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro na exclusão em massa:', err);
      setError('Erro ao conectar ao servidor. Verifique se o banco de dados está configurado.');
    }
  };"""
    ),
    (
        """  const toggleShiftStatus = async (shift: DailyShift) => {
    const newStatus = shift.status === 'pending' ? 'paid' : 'pending';
    
    try {
      // If marking as paid, we should ideally create the financial transaction first or atomically
      // But for now, we'll do it in sequence and handle errors
      if (newStatus === 'paid') {
        const emp = employees.find(e => e.id === shift.employeeId);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        // Use local date instead of UTC to avoid "next day" issues in late night operations
        const dateStr = now.toLocaleDateString('en-CA');
        
        const financeRes = await fetch('/api/financial-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expense',
            category: 'Mão de Obra',
            amount: Number(shift.amount),
            paidAmount: Number(shift.amount),
            date: dateStr,
            description: `Pagamento Diária #${shift.id}: ${emp?.name || 'Funcionário'} - Ref: ${formatDate(shift.date)} (${timeStr})`,
            clientName: emp?.name || 'Funcionário',
            relatedId: shift.id,
            status: 'completed'
          })
        });

        if (!financeRes.ok) {
          const errorData = await financeRes.json();
          // If it's a duplicate, we might want to proceed anyway if the user is trying to fix a desync
          if (!errorData.error?.includes('Já existe uma transação idêntica')) {
            throw new Error(`Erro ao criar lançamento financeiro: ${errorData.error}`);
          }
        }
      } else {
        // Find and delete related transaction if it exists
        const relatedTx = transactions.find(t => t.relatedId === shift.id && t.category === 'Mão de Obra');
        if (relatedTx) {
          await fetch(`/api/financial-transactions/${relatedTx.id}`, { method: 'DELETE' });
        }
      }


      // Update shift status
      const res = await fetch(`/api/shifts/${shift.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...shift, status: newStatus })
      });


      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao atualizar status da diária');
      }


      await fetchData();
      setSuccess(newStatus === 'paid' ? 'Diária paga e lançada no financeiro!' : 'Pagamento estornado.');
    } catch (err) {
      console.error('Error toggling shift status:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar status da diária');
    }
  };""",
        """  const toggleShiftStatus = async (shift: DailyShift) => {
    const newStatus = shift.status === 'pending' ? 'paid' : 'pending';
    
    try {
      if (newStatus === 'paid') {
        const emp = employees.find(e => e.id === shift.employeeId);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString('en-CA');
        const financeData = {
          type: 'expense',
          category: 'Mão de Obra',
          amount: Number(shift.amount),
          paidAmount: Number(shift.amount),
          date: dateStr,
          description: `Pagamento Diária #${shift.id}: ${emp?.name || 'Funcionário'} - Ref: ${formatDate(shift.date)} (${timeStr})`,
          clientName: emp?.name || 'Funcionário',
          relatedId: shift.id,
          status: 'completed'
        };

        try {
          if (isSupabaseConfigured) {
            await supabaseInsert<FinancialTransaction>('financial_transactions', financeData);
          } else {
            const financeRes = await fetch('/api/financial-transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(financeData)
            });
            if (!financeRes.ok) {
              const errorData = await financeRes.json();
              if (!errorData.error?.includes('Já existe uma transação idêntica')) {
                throw new Error(`Erro ao criar lançamento financeiro: ${errorData.error}`);
              }
            }
          }
        } catch (innerErr) {
          if (!(innerErr instanceof Error && innerErr.message.includes('Já existe uma transação idêntica'))) {
            throw innerErr;
          }
        }
      } else {
        const relatedTx = transactions.find(t => t.relatedId === shift.id && t.category === 'Mão de Obra');
        if (relatedTx) {
          if (isSupabaseConfigured) {
            await supabaseDelete('financial_transactions', relatedTx.id);
          } else {
            await fetch(`/api/financial-transactions/${relatedTx.id}`, { method: 'DELETE' });
          }
        }
      }

      if (isSupabaseConfigured) {
        await supabaseUpdate<DailyShift>('shifts', { ...shift, status: newStatus }, shift.id);
      } else {
        const res = await fetch(`/api/shifts/${shift.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...shift, status: newStatus })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Falha ao atualizar status da diária');
        }
      }

      await fetchData();
      setSuccess(newStatus === 'paid' ? 'Diária paga e lançada no financeiro!' : 'Pagamento estornado.');
    } catch (err) {
      console.error('Error toggling shift status:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar status da diária');
    }
  };"""
    ),
    (
        """  const processBulkPayShifts = async () => {
    if (selectedShifts.length === 0) return;


    try {
      // We allow both pending and paid shifts to be processed if explicitly selected, 
      // to help fix cases where the financial launch might have failed previously.
      const shiftsToProcess = shifts.filter(s => selectedShifts.includes(s.id));
      
      if (shiftsToProcess.length === 0) {
        setIsGroupedFinanceModalOpen(false);
        return;
      }


      // Group by employee
      const employeeGroups: { [key: number]: { name: string, amount: number, ids: number[], pendingIds: number[] } } = {};
      
      for (const shift of shiftsToProcess) {
        if (!employeeGroups[shift.employeeId]) {
          const emp = employees.find(e => e.id === shift.employeeId);
          employeeGroups[shift.employeeId] = { name: emp?.name || 'Funcionário', amount: 0, ids: [], pendingIds: [] };
        }
        employeeGroups[shift.employeeId].amount += Number(shift.amount);
        employeeGroups[shift.employeeId].ids.push(shift.id);
        if (shift.status === 'pending') {
          employeeGroups[shift.employeeId].pendingIds.push(shift.id);
        }
      }


      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      // Use local date instead of UTC to avoid "next day" issues in late night operations
      const dateStr = now.toLocaleDateString('en-CA');
      
      let successCount = 0;
      let failCount = 0;
      let lastErrorMessage = '';


      for (const empIdStr in employeeGroups) {
        const empId = parseInt(empIdStr);
        const group = employeeGroups[empId];
        
        // 1. Create financial transaction first
        const financeRes = await fetch('/api/financial-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expense',
            category: 'Mão de Obra',
            amount: group.amount,
            paidAmount: group.amount,
            date: dateStr,
            description: `Pagamento Lote Diárias: ${group.name} (${group.ids.length} diárias) - ${timeStr}`,
            clientName: group.name,
            status: 'completed'
          })
        });


        const resData = await financeRes.json();


        if (financeRes.ok || resData.error?.includes('Já existe uma transação idêntica')) {
          // 2. If finance succeeded (or was already there), update the shifts to 'paid'
          const shiftsToUpdate = shiftsToProcess.filter(s => s.employeeId === empId && s.status === 'pending');
          
          for (const shift of shiftsToUpdate) {
            await fetch(`/api/shifts/${shift.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...shift, status: 'paid' })
            });
          }
          successCount++;
        } else {
          console.error(`Falha ao criar transação para ${group.name}:`, resData.error);
          lastErrorMessage = resData.error || 'Erro desconhecido';
          failCount++;
        }
      }


      setSelectedShifts([]);
      setIsGroupedFinanceModalOpen(false);
      await fetchData();
      
      if (failCount === 0) {
        setSuccess('Pagamentos realizados e integrados ao financeiro!');
      } else {
        setError(`Erro em alguns lançamentos: ${successCount} sucessos, ${failCount} falhas. Último erro: ${lastErrorMessage}`);
      }
    } catch (err) {
      console.error('Error processing payments in batch:', err);
      setError('Erro ao processar pagamentos em lote. Verifique o console para detalhes.');
    }
  };""",
        """  const processBulkPayShifts = async () => {
    if (selectedShifts.length === 0) return;

    try {
      // We allow both pending and paid shifts to be processed if explicitly selected, 
      // to help fix cases where the financial launch might have failed previously.
      const shiftsToProcess = shifts.filter(s => selectedShifts.includes(s.id));
      
      if (shiftsToProcess.length === 0) {
        setIsGroupedFinanceModalOpen(false);
        return;
      }

      const employeeGroups: { [key: number]: { name: string, amount: number, ids: number[], pendingIds: number[] } } = {};
      
      for (const shift of shiftsToProcess) {
        if (!employeeGroups[shift.employeeId]) {
          const emp = employees.find(e => e.id === shift.employeeId);
          employeeGroups[shift.employeeId] = { name: emp?.name || 'Funcionário', amount: 0, ids: [], pendingIds: [] };
        }
        employeeGroups[shift.employeeId].amount += Number(shift.amount);
        employeeGroups[shift.employeeId].ids.push(shift.id);
        if (shift.status === 'pending') {
          employeeGroups[shift.employeeId].pendingIds.push(shift.id);
        }
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('en-CA');
      
      let successCount = 0;
      let failCount = 0;
      let lastErrorMessage = '';

      for (const empIdStr in employeeGroups) {
        const empId = parseInt(empIdStr);
        const group = employeeGroups[empId];
        
        try {
          if (isSupabaseConfigured) {
            await supabaseInsert<FinancialTransaction>('financial_transactions', {
              type: 'expense',
              category: 'Mão de Obra',
              amount: group.amount,
              paidAmount: group.amount,
              date: dateStr,
              description: `Pagamento Lote Diárias: ${group.name} (${group.ids.length} diárias) - ${timeStr}`,
              clientName: group.name,
              status: 'completed'
            });
          } else {
            const financeRes = await fetch('/api/financial-transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'expense',
                category: 'Mão de Obra',
                amount: group.amount,
                paidAmount: group.amount,
                date: dateStr,
                description: `Pagamento Lote Diárias: ${group.name} (${group.ids.length} diárias) - ${timeStr}`,
                clientName: group.name,
                status: 'completed'
              })
            });

            const resData = await financeRes.json();
            if (!financeRes.ok && !resData.error?.includes('Já existe uma transação idêntica')) {
              throw new Error(resData.error || 'Erro desconhecido');
            }
          }

          const shiftsToUpdate = shiftsToProcess.filter(s => s.employeeId === empId && s.status === 'pending');
          for (const shift of shiftsToUpdate) {
            if (isSupabaseConfigured) {
              await supabaseUpdate<DailyShift>('shifts', { ...shift, status: 'paid' }, shift.id);
            } else {
              await fetch(`/api/shifts/${shift.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...shift, status: 'paid' })
              });
            }
          }
          successCount++;
        } catch (batchErr) {
          console.error(`Falha ao processar pagamento para ${group.name}:`, batchErr);
          lastErrorMessage = batchErr instanceof Error ? batchErr.message : 'Erro desconhecido';
          failCount++;
        }
      }

      setSelectedShifts([]);
      setIsGroupedFinanceModalOpen(false);
      await fetchData();
      
      if (failCount === 0) {
        setSuccess('Pagamentos realizados e integrados ao financeiro!');
      } else {
        setError(`Erro em alguns lançamentos: ${successCount} sucessos, ${failCount} falhas. Último erro: ${lastErrorMessage}`);
      }
    } catch (err) {
      console.error('Error processing payments in batch:', err);
      setError('Erro ao processar pagamentos em lote. Verifique o console para detalhes.');
    }
  };"""
    ),
    (
        """  const updateCompanySettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Handle logo file
    const logoFile = (e.currentTarget.elements.namedItem('logo') as HTMLInputElement).files?.[0];
    let logoUrl = companySettings.logo_url;
    
    if (logoFile) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(logoFile);
      });
      logoUrl = base64;
    }


    try {
      const res = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, logo_url: logoUrl })
      });
      
      if (res.ok) {
        const result = await res.json();
        setCompanySettings(result.data);
        setSuccess('Configurações da empresa atualizadas com sucesso!');
      } else {
        setError('Erro ao atualizar configurações da empresa');
      }
""",
        """  const updateCompanySettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const logoFile = (e.currentTarget.elements.namedItem('logo') as HTMLInputElement).files?.[0];
    let logoUrl = companySettings.logo_url;
    
    if (logoFile) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(logoFile);
      });
      logoUrl = base64;
    }

    try {
      if (isSupabaseConfigured) {
        const payload = { ...data, logo_url: logoUrl } as any;
        const updated = await supabase.from<CompanySettings>('company_settings').upsert({ ...payload, id: companySettings.id }, { onConflict: 'id' }).select('*').maybeSingle();
        if (updated.error) {
          throw updated.error;
        }
        if (updated.data) {
          setCompanySettings(updated.data);
        }
        setSuccess('Configurações da empresa atualizadas com sucesso!');
        return;
      }

      const res = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, logo_url: logoUrl })
      });
      
      if (res.ok) {
        const result = await res.json();
        setCompanySettings(result.data);
        setSuccess('Configurações da empresa atualizadas com sucesso!');
      } else {
        setError('Erro ao atualizar configurações da empresa');
      }
"""
    )
]

for old, new in replacements:
    if old not in text:
        print('Pattern not found:')
        print(old[:240])
        exit(1)
    text = text.replace(old, new)

path.write_text(text.replace('\n','\r\n'), encoding='utf-8')
print('Applied App.tsx Supabase migration patches')
