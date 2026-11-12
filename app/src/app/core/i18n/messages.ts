import { GameId } from '../models/session';

export type Lang = 'de' | 'en';

export interface Messages {
  brandSubtitle: string;
  homeTitle: string;
  homeChooseLang: string;
  homePin: string;
  homeJoin: string;
  homeHost: string;
  homePinRequired: string;
  homePinUnknown: string;
  changeLanguage: string;

  joinTitle: string;
  joinTeamName: string;
  joinTeamPlaceholder: string;
  joinParents: string;
  joinChildren: string;
  joinFirstName: string;
  joinAddParent: string;
  joinAddChild: string;
  joinSubmit: string;
  joinPinMissing: string;
  joinFailed: string;
  joinRejoinTitle: string;
  joinRejoinHint: string;
  joinPickTeam: string;
  joinNoFreeTeams: string;
  joinTeamBusy: string;
  joinPeople: string;
  joinCreateNew: string;
  joinBackToTeams: string;

  playEnd: string;
  playTeam: string;
  playTeamMissing: string;
  playWaiting: string;
  playHeightsTitle: string;
  playUmfangTitle: string;
  playLookFront: string;
  playMemoryQuestion: string;
  playYourAnswer: string;
  playStudyTitle: string;
  playChocolate: string;
  playPainBefore: string;
  playPainAfter: string;
  playFeedbackTitle: string;
  playComment: string;
  playSend: string;
  playDoneTitle: string;
  playDoneThanks: string;
  playHome: string;
  playSaved: string;
  playRoleParent: string;
  playRoleChild: string;
  playRed: string;
  playBlack: string;
  playGameNotFound: string;
  playStudyIncomplete: string;
  playFeedbackRequired: string;
  playSendFailed: string;

  hostModerator: string;
  hostPassword: string;
  hostContinue: string;
  hostLogout: string;
  hostNewGame: string;
  hostRoomCircumference: string;
  hostDrug: string;
  hostStartGame: string;
  hostPastGames: string;
  hostNoGames: string;
  hostPin: string;
  hostDate: string;
  hostPhase: string;
  hostTeams: string;
  hostStatus: string;
  hostFinished: string;
  hostOpen: string;
  hostOpenAction: string;
  hostDelete: string;
  hostBack: string;
  hostNext: string;
  hostEndGame: string;
  hostToOverview: string;
  hostAddress: string;
  hostQrAlt: string;
  hostNoTeamsYet: string;
  hostHeightsEnter: string;
  hostUmfangGuess: string;
  hostMemoryQuestion: string;
  hostRound: string;
  hostCorrect: string;
  hostStudyTitle: string;
  hostDrugWas: string;
  hostFeedback: string;
  hostFeedbackCount: string;
  hostRecap: string;
  hostRecapMeta: string;
  hostNoData: string;
  hostNoEntries: string;
  hostHeightsUmfang: string;
  hostMemory: string;
  hostStudy: string;
  hostPerson: string;
  hostRole: string;
  hostHeightCm: string;
  hostUmfangM: string;
  hostDeltaM: string;
  hostPoints: string;
  hostRight: string;
  hostWrong: string;
  hostBefore: string;
  hostAfter: string;
  hostDelta: string;
  hostTreatment: string;
  hostStars: string;
  hostComment: string;
  hostEnterPassword: string;
  hostEnterUmfang: string;
  hostStartFailed: string;
  hostDeleteConfirm: string;
  hostDeleteFailed: string;
  hostLoginFailed: string;
  hostNoKey: string;
  hostNoKeyStart: string;
  hostActionFailed: string;
  hostGameMissing: string;
  game: Record<GameId, string>;
}

const de: Messages = {
  brandSubtitle: 'Mathe Macht Medikamente',
  homeTitle: 'Mathe Macht Medikamente',
  homeChooseLang: 'Sprache wählen',
  homePin: 'PIN',
  homeJoin: 'Beitreten',
  homeHost: 'Moderator',
  homePinRequired: 'Bitte PIN eingeben',
  homePinUnknown: 'Kein Spiel mit diesem PIN',
  changeLanguage: 'Sprache wechseln',

  joinTitle: 'Team beitreten',
  joinTeamName: 'Teamname',
  joinTeamPlaceholder: 'z.B. Herceptin',
  joinParents: 'Eltern',
  joinChildren: 'Kinder',
  joinFirstName: 'Vorname',
  joinAddParent: '+ Elternteil',
  joinAddChild: '+ Kind',
  joinSubmit: 'Beitreten',
  joinPinMissing: 'PIN fehlt',
  joinFailed: 'Beitritt fehlgeschlagen',
  joinRejoinTitle: 'Team wählen',
  joinRejoinHint: 'Das Spiel läuft schon. Wähle dein Team (nur freie Plätze).',
  joinPickTeam: 'Mit diesem Team weiterspielen',
  joinNoFreeTeams: 'Aktuell ist kein freies Team verfügbar.',
  joinTeamBusy: 'Dieses Team ist bereits auf einem anderen Gerät aktiv.',
  joinPeople: 'Personen',
  joinCreateNew: 'Neues Team erstellen',
  joinBackToTeams: 'Zurück zur Team-Auswahl',

  playEnd: 'Ende',
  playTeam: 'Team',
  playTeamMissing: 'Team nicht gefunden',
  playWaiting: 'Warten auf Start…',
  playHeightsTitle: 'Körpergrösse (cm)',
  playUmfangTitle: 'Zimmerumfang (m)',
  playLookFront: 'Schaut nach vorne',
  playMemoryQuestion: 'Welche Struktur war es?',
  playYourAnswer: 'Eure Antwort',
  playStudyTitle: 'Klinische Studie',
  playChocolate: 'Schokolade',
  playPainBefore: 'Schmerz vorher',
  playPainAfter: 'Schmerz nachher',
  playFeedbackTitle: 'Wie hat’s gefallen? (1–6)',
  playComment: 'Kommentar (optional)',
  playSend: 'Senden',
  playDoneTitle: 'Spiel wurde beendet',
  playDoneThanks: 'Danke fürs Mitmachen.',
  playHome: 'Zur Startseite',
  playSaved: 'Gespeichert',
  playRoleParent: 'Eltern',
  playRoleChild: 'Kind',
  playRed: 'Rot',
  playBlack: 'Schwarz',
  playGameNotFound: 'Spiel nicht gefunden',
  playStudyIncomplete:
    'Bitte für jede Person Schokolade und Schmerz vorher/nachher angeben',
  playFeedbackRequired: 'Bitte eine Bewertung wählen',
  playSendFailed: 'Senden fehlgeschlagen',

  hostModerator: 'Moderator',
  hostPassword: 'Passwort',
  hostContinue: 'Weiter',
  hostLogout: 'Abmelden',
  hostNewGame: 'Neues Spiel',
  hostRoomCircumference: 'Zimmerumfang (m)',
  hostDrug: 'Medikament',
  hostStartGame: 'Neues Spiel starten',
  hostPastGames: 'Vergangene Spiele',
  hostNoGames: 'Noch keine Spiele.',
  hostPin: 'PIN',
  hostDate: 'Datum',
  hostPhase: 'Phase',
  hostTeams: 'Teams',
  hostStatus: 'Status',
  hostFinished: 'Beendet',
  hostOpen: 'Offen',
  hostOpenAction: 'Öffnen',
  hostDelete: 'Löschen',
  hostBack: 'Zurück',
  hostNext: 'Weiter',
  hostEndGame: 'Spiel beenden',
  hostToOverview: 'Zur Übersicht',
  hostAddress: 'Adresse',
  hostQrAlt: 'QR Code zum Beitreten',
  hostNoTeamsYet: 'Noch keine Teams',
  hostHeightsEnter: 'Körpergrösse eintragen',
  hostUmfangGuess: 'Zimmerumfang schätzen',
  hostMemoryQuestion: 'Welche Struktur war es?',
  hostRound: 'Runde',
  hostCorrect: 'Richtig',
  hostStudyTitle: 'Klinische Studie',
  hostDrugWas: 'war das Medikament',
  hostFeedback: 'Feedback',
  hostFeedbackCount: 'von',
  hostRecap: 'Auswertung',
  hostRecapMeta: 'Teams · Zimmerumfang',
  hostNoData: 'Noch keine Daten',
  hostNoEntries: 'Keine Einträge',
  hostHeightsUmfang: 'Körpergrösse & Zimmerumfang',
  hostMemory: 'Molekül Memory',
  hostStudy: 'Klinische Studie',
  hostPerson: 'Person',
  hostRole: 'Rolle',
  hostHeightCm: 'Grösse (cm)',
  hostUmfangM: 'Umfang (m)',
  hostDeltaM: 'Differenz (m)',
  hostPoints: 'Punkte',
  hostRight: 'richtig',
  hostWrong: 'falsch',
  hostBefore: 'Vorher',
  hostAfter: 'Nachher',
  hostDelta: 'Delta',
  hostTreatment: 'Behandlung',
  hostStars: 'Sterne',
  hostComment: 'Kommentar',
  hostEnterPassword: 'Bitte Passwort eingeben',
  hostEnterUmfang: 'Bitte Zimmerumfang eingeben',
  hostStartFailed: 'Spiel konnte nicht gestartet werden',
  hostDeleteConfirm: 'wirklich löschen?',
  hostDeleteFailed: 'Spiel konnte nicht gelöscht werden',
  hostLoginFailed: 'Anmeldung fehlgeschlagen',
  hostNoKey: 'Kein Moderator-Schlüssel in diesem Browser.',
  hostNoKeyStart: 'Kein Moderator-Schlüssel. Bitte das Spiel hier starten.',
  hostActionFailed: 'Aktion fehlgeschlagen',
  hostGameMissing: 'Spiel nicht gefunden',
  game: {
    lobby: 'Tech Check',
    heights: 'Spiel der Körpergrössen',
    circumference: 'Rat den Zimmerumfang',
    memory: 'Molekül Memory',
    study: 'Klinische Studie',
    feedback: 'Feedback',
    done: 'Auswertung',
  },
};

const en: Messages = {
  brandSubtitle: 'Math Makes Medicine',
  homeTitle: 'Math Makes Medicine',
  homeChooseLang: 'Choose language',
  homePin: 'PIN',
  homeJoin: 'Join',
  homeHost: 'Host',
  homePinRequired: 'Please enter a PIN',
  homePinUnknown: 'No game with this PIN',
  changeLanguage: 'Change language',

  joinTitle: 'Join a team',
  joinTeamName: 'Team name',
  joinTeamPlaceholder: 'e.g. Herceptin',
  joinParents: 'Parents',
  joinChildren: 'Children',
  joinFirstName: 'First name',
  joinAddParent: '+ Parent',
  joinAddChild: '+ Child',
  joinSubmit: 'Join',
  joinPinMissing: 'PIN missing',
  joinFailed: 'Could not join',
  joinRejoinTitle: 'Choose your team',
  joinRejoinHint: 'The game has already started. Pick your team (free seats only).',
  joinPickTeam: 'Continue with this team',
  joinNoFreeTeams: 'No free team is available right now.',
  joinTeamBusy: 'This team is already active on another device.',
  joinPeople: 'People',
  joinCreateNew: 'Create a new team',
  joinBackToTeams: 'Back to team selection',

  playEnd: 'End',
  playTeam: 'Team',
  playTeamMissing: 'Team not found',
  playWaiting: 'Waiting to start…',
  playHeightsTitle: 'Height (cm)',
  playUmfangTitle: 'Room circumference (m)',
  playLookFront: 'Look to the front',
  playMemoryQuestion: 'Which structure was it?',
  playYourAnswer: 'Your answer',
  playStudyTitle: 'Clinical study',
  playChocolate: 'Chocolate',
  playPainBefore: 'Pain before',
  playPainAfter: 'Pain after',
  playFeedbackTitle: 'How did you like it? (1–6)',
  playComment: 'Comment (optional)',
  playSend: 'Submit',
  playDoneTitle: 'Game finished',
  playDoneThanks: 'Thanks for playing.',
  playHome: 'Back to home',
  playSaved: 'Saved',
  playRoleParent: 'Parent',
  playRoleChild: 'Child',
  playRed: 'Red',
  playBlack: 'Black',
  playGameNotFound: 'Game not found',
  playStudyIncomplete: 'Please enter chocolate and pain before/after for every person',
  playFeedbackRequired: 'Please choose a rating',
  playSendFailed: 'Could not submit',

  hostModerator: 'Host',
  hostPassword: 'Password',
  hostContinue: 'Continue',
  hostLogout: 'Log out',
  hostNewGame: 'New game',
  hostRoomCircumference: 'Room circumference (m)',
  hostDrug: 'Drug',
  hostStartGame: 'Start new game',
  hostPastGames: 'Past games',
  hostNoGames: 'No games yet.',
  hostPin: 'PIN',
  hostDate: 'Date',
  hostPhase: 'Phase',
  hostTeams: 'Teams',
  hostStatus: 'Status',
  hostFinished: 'Finished',
  hostOpen: 'Open',
  hostOpenAction: 'Open',
  hostDelete: 'Delete',
  hostBack: 'Back',
  hostNext: 'Next',
  hostEndGame: 'End game',
  hostToOverview: 'Overview',
  hostAddress: 'Address',
  hostQrAlt: 'QR code to join',
  hostNoTeamsYet: 'No teams yet',
  hostHeightsEnter: 'Enter height',
  hostUmfangGuess: 'Guess room circumference',
  hostMemoryQuestion: 'Which structure was it?',
  hostRound: 'Round',
  hostCorrect: 'Correct',
  hostStudyTitle: 'Clinical study',
  hostDrugWas: 'was the drug',
  hostFeedback: 'Feedback',
  hostFeedbackCount: 'of',
  hostRecap: 'Results',
  hostRecapMeta: 'teams · room circumference',
  hostNoData: 'No data yet',
  hostNoEntries: 'No entries',
  hostHeightsUmfang: 'Height & room circumference',
  hostMemory: 'Molecule memory',
  hostStudy: 'Clinical study',
  hostPerson: 'Person',
  hostRole: 'Role',
  hostHeightCm: 'Height (cm)',
  hostUmfangM: 'Circumference (m)',
  hostDeltaM: 'Difference (m)',
  hostPoints: 'Points',
  hostRight: 'correct',
  hostWrong: 'wrong',
  hostBefore: 'Before',
  hostAfter: 'After',
  hostDelta: 'Delta',
  hostTreatment: 'Treatment',
  hostStars: 'Stars',
  hostComment: 'Comment',
  hostEnterPassword: 'Please enter the password',
  hostEnterUmfang: 'Please enter the room circumference',
  hostStartFailed: 'Could not start the game',
  hostDeleteConfirm: 'really delete?',
  hostDeleteFailed: 'Could not delete the game',
  hostLoginFailed: 'Login failed',
  hostNoKey: 'No host key in this browser.',
  hostNoKeyStart: 'No host key. Please start the game here.',
  hostActionFailed: 'Action failed',
  hostGameMissing: 'Game not found',
  game: {
    lobby: 'Tech check',
    heights: 'Height game',
    circumference: 'Guess the room circumference',
    memory: 'Molecule memory',
    study: 'Clinical study',
    feedback: 'Feedback',
    done: 'Results',
  },
};

export const MESSAGES: Record<Lang, Messages> = { de, en };
