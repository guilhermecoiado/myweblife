// Utilitários para formatação de data e hora
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTime = (time: string): string => {
  // Se já está no formato HH:MM, retorna como está
  if (time.match(/^\d{2}:\d{2}$/)) {
    return time;
  }
  
  // Se está no formato HH:MM:SS, remove os segundos
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return time.substring(0, 5);
  }
  
  return time;
};

export const formatDateForInput = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

export const formatTimeForInput = (time: string): string => {
  // Garantir formato HH:MM para inputs
  if (time.match(/^\d{1,2}:\d{2}$/)) {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  return time;
};

export const getCurrentWeekDateRange = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return `${formatDate(monday)} - ${formatDate(sunday)}`;
};

export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.toDateString() === today.toDateString();
};

export const isThisWeek = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return dateObj >= monday && dateObj <= sunday;
};

// Função para formatar data para exibição em formulários (dd/mm/yyyy)
export const formatDateForDisplay = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};

// Função para converter data do banco (yyyy-mm-dd) para input brasileiro (dd/mm/yyyy)
export const convertDateToInput = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    // Se está no formato yyyy-mm-dd (do banco), converte para dd/mm/yyyy
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Se já está no formato dd/mm/yyyy, retorna como está
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return dateStr;
    }
    
    // Tentar converter data ISO para dd/mm/yyyy
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return formatDateForDisplay(date);
    }
  } catch (error) {
    console.error('Erro ao converter data:', error);
  }
  
  return dateStr;
};

// Função para converter data do input brasileiro (dd/mm/yyyy) para formato do banco (yyyy-mm-dd)
export const convertInputToDate = (inputDate: string): string => {
  if (!inputDate) return '';
  
  try {
    // Se está no formato dd/mm/yyyy, converte para yyyy-mm-dd
    if (inputDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = inputDate.split('/');
      return `${year}-${month}-${day}`;
    }
    
    // Se já está no formato yyyy-mm-dd, retorna como está
    if (inputDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return inputDate;
    }
    
    // Tentar converter outros formatos
    const date = new Date(inputDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Erro ao converter data:', error);
  }
  
  return inputDate;
};

// Função para formatar input de data brasileiro com máscara
export const formatDateInput = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara dd/mm/yyyy
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
};

// Função para validar data no formato dd/mm/yyyy
export const isValidDateFormat = (dateStr: string): boolean => {
  if (!dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return false;
  }
  
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
};

// Função para formatar input de hora com máscara
export const formatTimeInput = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara HH:MM
  if (numbers.length <= 2) {
    return numbers;
  } else {
    return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
  }
};

// Função para validar hora no formato HH:MM
export const isValidTimeFormat = (timeStr: string): boolean => {
  if (!timeStr.match(/^\d{2}:\d{2}$/)) {
    return false;
  }
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};