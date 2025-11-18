// Validation utilities for MedDispatchRec

import { MedDispatchRec, ValidationError } from '@/types';

export function validateDispatch(dispatch: MedDispatchRec): ValidationError[] {
  const errors: ValidationError[] = [];
  const id = dispatch.id;

  // Validate date
  if (!dispatch.date) {
    errors.push({ field: 'date', message: 'Date is required', dispatchId: id });
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dispatch.date)) {
    errors.push({ field: 'date', message: 'Date must be in yyyy-MM-dd format', dispatchId: id });
  }

  // Validate time
  if (!dispatch.time) {
    errors.push({ field: 'time', message: 'Time is required', dispatchId: id });
  } else if (!/^\d{2}:\d{2}$/.test(dispatch.time)) {
    errors.push({ field: 'time', message: 'Time must be in HH:mm format', dispatchId: id });
  }

  // Validate requirements
  if (!dispatch.requirements) {
    errors.push({ field: 'requirements', message: 'Requirements are required', dispatchId: id });
  } else {
    if (typeof dispatch.requirements.capacity !== 'number' || dispatch.requirements.capacity <= 0) {
      errors.push({ field: 'requirements.capacity', message: 'Capacity must be a positive number', dispatchId: id });
    }
  }

  // Validate delivery location
  if (!dispatch.delivery) {
    errors.push({ field: 'delivery', message: 'Delivery location is required', dispatchId: id });
  } else {
    if (typeof dispatch.delivery.lat !== 'number' || dispatch.delivery.lat < -90 || dispatch.delivery.lat > 90) {
      errors.push({ field: 'delivery.lat', message: 'Latitude must be between -90 and 90', dispatchId: id });
    }
    if (typeof dispatch.delivery.lng !== 'number' || dispatch.delivery.lng < -180 || dispatch.delivery.lng > 180) {
      errors.push({ field: 'delivery.lng', message: 'Longitude must be between -180 and 180', dispatchId: id });
    }
  }

  return errors;
}

export function validateDispatches(dispatches: MedDispatchRec[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for empty array
  if (!dispatches || dispatches.length === 0) {
    errors.push({ field: 'dispatches', message: 'At least one dispatch is required' });
    return errors;
  }

  // Validate each dispatch
  for (const dispatch of dispatches) {
    errors.push(...validateDispatch(dispatch));
  }

  // Check for duplicate IDs
  const ids = dispatches.map(d => d.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)];
    for (const dupId of uniqueDuplicates) {
      errors.push({ field: 'id', message: `Duplicate ID: ${dupId}`, dispatchId: dupId });
    }
  }

  return errors;
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(e => {
    if (e.dispatchId !== undefined) {
      return `Dispatch ${e.dispatchId}: ${e.message}`;
    }
    return e.message;
  }).join('; ');
}
