import React from 'react';
import { Modal } from '@/components/ui/core/Modal';
import { useTranslations } from 'next-intl';
import { Paddler } from '@/types';
import PaddlerForm from '../../drachenboot/team/PaddlerForm';

interface AddGuestModalProps {
  onClose: () => void;
  onAdd: (guest: Pick<Paddler, 'name' | 'weight' | 'skills'>) => void;
}

const AddGuestModal: React.FC<AddGuestModalProps> = ({ onClose, onAdd }) => {
  const t = useTranslations();

  const handleSave = (data: { name: string; weight: number; skills: string[] }) => {
    onAdd({
      name: data.name,
      weight: data.weight,
      skills: data.skills,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('guestAddTitle')}
      size="md"
    >
      <PaddlerForm 
        paddlerToEdit={null}
        onSave={handleSave}
        onCancel={onClose}
        t={t}
        isModal={true}
        isGuest={true}
      />
    </Modal>
  );
};

export default AddGuestModal;
