// ScoreService.gs
// Manages Grading, scoring, and feedback operations on student submissions.

var ScoreService = {
  getScores: function() {
    return SpreadsheetService.readAllRows(Config.SHEET_SCORES);
  },

  saveScore: function(payload, gradedByUsername) {
    var subs = SpreadsheetService.readAllRows(Config.SHEET_SUBMISSIONS);
    var sub = subs.find(function(s) { return s.submission_id === payload.submissionId; });

    var scores = this.getScores();
    var existingIdx = scores.findIndex(function(s) { return s.submission_id === payload.submissionId; });

    var newScore = {
      'score_id': existingIdx > -1 ? scores[existingIdx].score_id : Utils.generateId('SC'),
      'submission_id': payload.submissionId,
      'student_name': sub.student_name,
      'class_id': sub.class_id,
      'class_name': sub.class_name,
      'section_id': sub.section_id,
      'section_name': sub.section_name,
      'score': parseFloat(payload.score),
      'max_score': parseFloat(payload.maxScore),
      'feedback': payload.feedback || '',
      'graded_at': Utils.getTimestamp(),
      'graded_by': gradedByUsername || 'Admin'
    };

    if (existingIdx > -1) {
      SpreadsheetService.updateRow(Config.SHEET_SCORES, 'score_id', newScore.score_id, newScore);
    } else {
      SpreadsheetService.appendRow(Config.SHEET_SCORES, newScore);
    }
    return newScore;
  }
};