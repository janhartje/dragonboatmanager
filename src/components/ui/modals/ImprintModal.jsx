import React from 'react';
import { X } from 'lucide-react';

const ImprintModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-500"><X size={20} /></button>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Impressum</h2>
      <div className="text-sm text-slate-700 dark:text-slate-300 space-y-4 overflow-y-auto max-h-[60vh]">
        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Angaben gemäß § 5 TMG</h3>
          <p>Jan Hartje<br />Hamburger Allee 6<br />30161 Hannover</p>
        </section>
        
        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Kontakt</h3>
          <p>E-Mail: info@janhartje.com</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
          <p>Jan Hartje<br />Hamburger Allee 6<br />30161 Hannover</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Haftung für Inhalte</h3>
          <p className="text-xs">Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Haftung für Links</h3>
          <p className="text-xs">Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">Urheberrecht</h3>
          <p className="text-xs">Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.</p>
        </section>
      </div>
    </div>
  </div>
);

export default ImprintModal;
