import { Employee, ProductionStep, ProductionOrder } from '../types';

export const getOrderStats = (
  orderId: number, 
  productionSteps: ProductionStep[], 
  employees: Employee[]
) => {
  const steps = productionSteps.filter(s => s.orderId === orderId);
  const cutting = steps.filter(s => s.stepType === 'cutting').reduce((acc, s) => acc + s.quantity, 0);
  const sewing = steps.filter(s => s.stepType === 'sewing').reduce((acc, s) => acc + s.quantity, 0);
  const finishing = steps.filter(s => s.stepType === 'finishing').reduce((acc, s) => acc + s.quantity, 0);
  
  const allocatedEmployees = [...new Set(steps.map(s => s.employeeId))].map(id => {
      const emp = employees.find(e => e.id === id);
      const empSteps = steps.filter(s => s.employeeId === id);
      return {
          ...emp,
          totalProduced: empSteps.reduce((acc, s) => acc + s.quantity, 0),
          steps: empSteps
      };
  });

  return { cutting, sewing, finishing, allocatedEmployees };
};
