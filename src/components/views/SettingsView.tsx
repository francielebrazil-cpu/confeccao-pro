import React from 'react';
import { 
  Database, 
  RefreshCcw, 
  Users, 
  Image, 
  Settings as SettingsIcon, 
  FileDown, 
  AlertTriangle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  CompanySettings, 
  User 
} from '../../types';

interface SettingsViewProps {
  error: string;
  setError: (val: string) => void;
  fetchData: () => void;
  companySettings: CompanySettings;
  updateCompanySettings: (e: React.FormEvent<HTMLFormElement>) => void;
  formDocType: 'CPF' | 'CNPJ';
  setFormDocType: (val: 'CPF' | 'CNPJ') => void;
  user: User | null;
  updateUser: (e: React.FormEvent<HTMLFormElement>) => void;
  handleBackup: () => void;
  resetApp: () => void;
}

export const SettingsView = ({
  error,
  setError,
  fetchData,
  companySettings,
  updateCompanySettings,
  formDocType,
  setFormDocType,
  user,
  updateUser,
  handleBackup,
  resetApp
}: SettingsViewProps) => {

  return (
    <motion.div 
      key="settings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-2xl space-y-6"
    >
      <div className="card p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Status da Conexão</h3>
            <p className="text-slate-500 text-sm">Verifique se o banco de dados está conectado</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${error && error.includes('servidor') ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-sm font-medium text-slate-700">
              {error && error.includes('servidor') ? 'Desconectado do Supabase' : 'Conectado ao Supabase'}
            </span>
          </div>
          {error && error.includes('servidor') && (
            <button 
              onClick={() => {
                setError('');
                fetchData();
              }}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Tentar Novamente"
            >
              <RefreshCcw size={16} />
            </button>
          )}
        </div>
        
        {error && error.includes('servidor') && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs leading-relaxed">
            <p className="font-bold mb-1">Como resolver:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Vá em <b>Settings &gt; Secrets</b> no AI Studio (menu lateral esquerdo).</li>
              <li>Adicione as chaves: <b>VITE_SUPABASE_URL</b>, <b>VITE_SUPABASE_ANON_KEY</b> e <b>SUPABASE_SERVICE_ROLE_KEY</b>.</li>
              <li>Certifique-se de que executou o script SQL no painel do Supabase (SQL Editor).</li>
            </ol>
          </div>
        )}
      </div>

      <div className="card p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Dados da Empresa (Administrador)</h3>
            <p className="text-slate-500 text-sm">Informações que aparecerão nos relatórios e documentos</p>
          </div>
        </div>

        <form onSubmit={updateCompanySettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa / Administrador</label>
              <input name="name" type="text" className="input" defaultValue={companySettings.name} required />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Documento</label>
              <select 
                name="document_type" 
                className="input" 
                value={formDocType}
                onChange={(e) => setFormDocType(e.target.value as 'CPF' | 'CNPJ')}
              >
                <option value="CNPJ">CNPJ</option>
                <option value="CPF">CPF</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número do Documento</label>
              <input name="document_number" type="text" className="input" defaultValue={companySettings.document_number} placeholder={formDocType === 'CNPJ' ? "00.000.000/0000-00" : "000.000.000-00"} />
            </div>

            {formDocType === 'CNPJ' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Estadual</label>
                <input name="state_registration" type="text" className="input" defaultValue={companySettings.state_registration} />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RG</label>
                <input name="rg" type="text" className="input" defaultValue={companySettings.rg} />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
              <input name="address" type="text" className="input" defaultValue={companySettings.address} placeholder="Rua, Número, Bairro, Cidade - UF" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Logomarca do Administrador (Apenas para Relatórios)</label>
              <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                {companySettings.logo_url ? (
                  <div className="relative group">
                    <img src={companySettings.logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-white" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Image size={24} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <Image size={32} />
                  </div>
                )}
                <div className="flex-1">
                  <input 
                    name="logo" 
                    type="file" 
                    accept="image/*" 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all" 
                  />
                  <p className="mt-1 text-xs text-slate-400">PNG, JPG ou SVG. Recomendado: 200x200px (Fundo transparente)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="btn-primary w-full md:w-auto px-8">
              Salvar Dados da Empresa
            </button>
          </div>
        </form>
      </div>

      <div className="card p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Configurações de Conta</h3>
            <p className="text-slate-500 text-sm">Altere suas credenciais de acesso</p>
          </div>
        </div>

        <form onSubmit={updateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Novo Nome de Usuário</label>
            <input name="newUsername" type="text" className="input" defaultValue={user?.username} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
              <input name="newPassword" type="password" className="input" placeholder="••••••••" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
              <input name="confirmPassword" type="password" className="input" placeholder="••••••••" required />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" className="btn-primary w-full md:w-auto px-8">
              Atualizar Credenciais
            </button>
          </div>
        </form>
      </div>

      <div className="card p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Backup de Segurança</h3>
            <p className="text-slate-500 text-sm">Exporte todos os dados do sistema em formato SQL</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
          <h4 className="font-bold text-emerald-800 mb-2">Exportar Dados (SQL Dump)</h4>
          <p className="text-emerald-700 text-sm mb-4">
            Gere um arquivo .sql contendo todos os registros atuais das tabelas do Supabase. 
            Este arquivo pode ser usado para restauração manual ou migração.
          </p>
          <button 
            onClick={handleBackup}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            <FileDown size={20} /> Baixar Backup SQL
          </button>
        </div>
      </div>

      <div className="card p-8 border-red-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Zona de Perigo</h3>
            <p className="text-slate-500 text-sm">Ações irreversíveis que afetam todo o sistema</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-8">
          <h4 className="font-bold text-red-800 mb-2">Resetar Aplicativo</h4>
          <p className="text-red-700 text-sm mb-4">
            Esta ação apagará permanentemente todos os registros de funcionários, diárias e pagamentos. 
            Não é possível desfazer esta operação.
          </p>
          <button 
            onClick={resetApp}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
          >
            <RefreshCcw size={20} /> Resetar Tudo do Zero
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h4 className="font-bold text-slate-800 mb-2">Informações do Sistema</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-slate-500">Versão</p>
              <p className="font-bold">1.0.0</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-slate-500">Ambiente</p>
              <p className="font-bold">Produção</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
