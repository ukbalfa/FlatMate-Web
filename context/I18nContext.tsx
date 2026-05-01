'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'en' | 'ru' | 'es';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.rates': 'Exchange Rates',
    'nav.expenses': 'Expenses',
    'nav.balances': 'Balances',
    'nav.cleaning': 'Cleaning',
    'nav.tasks': 'Tasks',
    'nav.roommates': 'Roommates',
    'nav.settings': 'Settings',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.loading': 'Loading...',
    'dashboard.welcome': 'Welcome back',
    'dashboard.totalExpenses': 'Total expenses',
    'expenses.title': 'Expenses',
    'expenses.addExpense': 'Add Expense',
    'tasks.title': 'Tasks',
    'cleaning.title': 'Cleaning Schedule',
    'balances.title': 'Balances',
    'balances.whoOwes': 'Who Owes Whom',
    'settings.title': 'Settings',
    'notifications.title': 'Notifications',
  },
  ru: {
    'nav.dashboard': 'Главная',
    'nav.rates': 'Курсы валют',
    'nav.expenses': 'Расходы',
    'nav.balances': 'Баланс',
    'nav.cleaning': 'Уборка',
    'nav.tasks': 'Задачи',
    'nav.roommates': 'Соседи',
    'nav.settings': 'Настройки',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Изменить',
    'common.add': 'Добавить',
    'common.loading': 'Загрузка...',
    'dashboard.welcome': 'С возвращением',
    'dashboard.totalExpenses': 'Общие расходы',
    'expenses.title': 'Расходы',
    'expenses.addExpense': 'Добавить расход',
    'tasks.title': 'Задачи',
    'cleaning.title': 'График уборки',
    'balances.title': 'Баланс расходов',
    'balances.whoOwes': 'Кто кому должен',
    'settings.title': 'Настройки',
    'notifications.title': 'Уведомления',
  },
  es: {
    'nav.dashboard': 'Panel',
    'nav.rates': 'Tipos de Cambio',
    'nav.expenses': 'Gastos',
    'nav.balances': 'Saldos',
    'nav.cleaning': 'Limpieza',
    'nav.tasks': 'Tareas',
    'nav.roommates': 'Compañeros',
    'nav.settings': 'Ajustes',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.add': 'Añadir',
    'common.loading': 'Cargando...',
    'dashboard.welcome': 'Bienvenido',
    'dashboard.totalExpenses': 'Gastos totales',
    'expenses.title': 'Gastos',
    'expenses.addExpense': 'Añadir gasto',
    'tasks.title': 'Tareas',
    'cleaning.title': 'Horario de Limpieza',
    'balances.title': 'Saldos de Gastos',
    'balances.whoOwes': 'Quién debe a quién',
    'settings.title': 'Ajustes',
    'notifications.title': 'Notificaciones',
  },
};

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function useI18n() {
  return useContext(I18nContext);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('flatmate-language') as Language | null;
    if (saved && ['en', 'ru', 'es'].includes(saved)) {
      setLanguageState((current) => (current === saved ? current : saved));
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('flatmate-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}
