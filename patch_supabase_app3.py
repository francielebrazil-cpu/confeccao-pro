from pathlib import Path

path = Path('src/App.tsx')
text = path.read_text(encoding='utf-8')
text = text.replace('\r\n', '\n')
replacements = [
    (
        """const deleteClient = async (id: number) => {
    triggerConfirm('Excluir Cliente', 'Deseja realmente excluir este cliente?', async () => {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      fetchData();
      setSuccess('Cliente excluído com sucesso!');
    });
  };""",
        """const saveClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    try {
      const clientData = {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        active: true
      };

      if (isSupabaseConfigured) {
        if (editingClient) {
          const updated = await supabaseUpdate<Client>('clients', clientData, editingClient.id);
          if (updated && updated[0]) {
            setClients(prev => prev.map(c => c.id === editingClient.id ? updated[0] : c));
          }
        } else {
          const inserted = await supabaseInsert<Client>('clients', clientData);
          if (Array.isArray(inserted) && inserted[0]) {
            setClients(prev => [inserted[0], ...prev]);
          }
        }
        setIsClientModalOpen(false);
        setEditingClient(null);
        setSuccess('Cliente salvo com sucesso!');
        return;
      }

      const data = { name, email, phone, address, active: true };
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
          fetchData();
          setSuccess('Cliente excluído com sucesso!');
          return;
        }
        await fetch(`/api/clients/${id}`, { method: 'DELETE' });
        fetchData();
        setSuccess('Cliente excluído com sucesso!');
      } catch (err) {
        setError('Erro ao excluir cliente');
      }
    });
  };"""
    ),
    (
        """const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
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
        """const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
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
        """const deleteProduct = async (product: Product) => {
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
        """const deleteProduct = async (product: Product) => {
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
    )
]
for old, new in replacements:
    if old not in text:
        raise ValueError('Pattern not found: ' + old[:120])
    text = text.replace(old, new)
path.write_text(text.replace('\n','\r\n'), encoding='utf-8')
print('patched clients and products')
