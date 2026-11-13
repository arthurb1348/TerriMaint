import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, inject } from '@angular/core';

@Component({
  selector: 'app-privacy',
  standalone: true,
  template: `
    <section class="feature-page" aria-labelledby="privacy-title">
      <h1 id="privacy-title">Confidentialité</h1>
      <p>Cette page décrit la démo TerriMaint présentée à l’oral, pas un service de production.</p>
      <h2>Photos et scanner QR</h2>
      <p>Prendre une photo ou choisir une image ouvre le sélecteur de l’appareil. Selon le navigateur et l’appareil, un accès à la caméra ou aux photos peut être demandé. Sur grand écran, le formulaire propose l’ajout de photos par sélection de fichiers.</p>
      <p>Le scanner QR est différent : sa caméra démarre après votre action et peut demander une autorisation. L’image est analysée dans le navigateur. La saisie manuelle de la référence reste possible sans caméra.</p>
      <h2>Microphone et position</h2>
      <p>Enregistrer une note vocale peut demander l’accès au microphone. Utiliser ma position peut demander l’accès à la localisation. Ces demandes suivent votre action ; une autorisation déjà accordée peut être réutilisée.</p>
      <p>Pour un signalement, photos, note vocale, position et description sont facultatives. Un signalement sans équipement nécessite un lieu écrit ; la position ne le remplace pas.</p>
      <h2>Dans cet onglet</h2>
      <p>Les signalements, interventions et médias confirmés restent en mémoire dans cet onglet, même en changeant d’espace. La démo ne les envoie pas à une API métier. Recharger ou fermer l’onglet perd ces créations et rétablit les exemples. Une saisie non confirmée est abandonnée en quittant son formulaire.</p>
      <h2>Carte et échanges réseau</h2>
      <p>Les coordonnées jointes sont utilisées dans le navigateur. Ouvrir une fiche ne demande pas une nouvelle position et ne charge pas le fond de carte.</p>
      <p>Afficher la carte charge le moteur depuis l’application et demande des images à OpenStreetMap. Le fournisseur reçoit notamment votre adresse IP, l’origine du site et les références des tuiles : ces références révèlent la zone affichée, même sans coordonnées écrites dans l’adresse demandée.</p>
      <p>Ces demandes externes s’ajoutent aux échanges ordinaires : chargement des pages, du code et des images de l’application, et vérification de l’état de l’API sur l’accueil général. Garder les créations en mémoire ne signifie donc pas que la démo fonctionne sans réseau.</p>
    </section>
  `,
  styles: `:host { display: block; max-width: 768px; } h2 { margin-top: 32px; font-size: 1.125rem; }`,
  styleUrls: ['../incidents/incident-presentation.css'],
})
export class Privacy {
  private readonly document = inject(DOCUMENT);
  constructor() {
    afterNextRender(() => this.document.getElementById('main-content')?.focus());
  }
}
