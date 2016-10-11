/** @namespace */
var OC = OC || {};

/**
 * Interactions counter
 * @type {Array}
 */
OC.interactions = [];

/**
 * Answered Layer
 * @type {Array}
 */
OC.answered = [];

/**
 * SubContentIds - avoid duplicated answered statement
 * @type {Array}
 */
OC.subIds = [];

/**
 * Internal H5P function listening for xAPI answered events and stores scores.
 *
 * @param {H5P.XAPIEvent} event
 */
OC.xAPIAnsweredListener = function (event) {
    var contentId = event.getVerifiedStatementValue(['object', 'definition', 'extensions', 'http://h5p.org/x-api/h5p-local-content-id']);

    if (event.getVerb() === 'answered') {
        var score = event.getScore();
        var maxScore = event.getMaxScore();
        var subContentId = event.data.statement.object.id;

        if ((OC.subIds.indexOf(subContentId) == -1) && (score == maxScore)) {
            if (typeof OC.answered[contentId] === 'undefined') {
                OC.answered[contentId] = 1;
            }

            if (typeof OC.interactions[contentId] === 'undefined') {
                OC.interactions[contentId] = 1;
            }

            var answered = OC.answered[contentId];
            var interactions = OC.interactions[contentId];
            var percentage = (answered / interactions) * 100;

            OC.setResult(contentId, percentage, 100);
            OC.answered[contentId] += 1;
            OC.subIds.push(subContentId);
        }
    }

    if (OC.interactions.length === 0 && event.getVerb() === 'completed') {
        OC.setResult(contentId, 100, 100);
    }
};

/**
 * Post answered results for user and set progress.
 *
 * @param {number} contentId
 *   Identifies the content
 * @param {number} score
 *   Achieved score/points
 * @param {number} maxScore
 *   The maximum score/points that can be achieved
 */
OC.setResult = function (contentId, score, maxScore) {
    $.post(H5PIntegration.ajax.setFinished, {
        contentId: contentId,
        score: score,
        maxScore: maxScore
    }, function (data) {
        var div_id = String('oc-progress-' + data.sectionId);
        var text_div_id = String('oc-progress-text-' + data.sectionId);
        var percentage = Math.round(data.percentage);
        percentage = String(percentage + '%');

        $('#' + div_id, window.parent.document).css('width', percentage);
        $('#' + text_div_id, window.parent.document).html(percentage);
    }, 'json');
};


/**
 * Count interactions layers from H5P element.
 */
OC.getVideoInteractions = function () {
    $('iframe[class="h5p-iframe h5p-initialized"]').each(function () {
        var contentId = $(this).data('content-id');
        var contentData = H5PIntegration.contents['cid-' + contentId];
        var content = JSON.parse(contentData.jsonContent);
        var interactions = content.interactiveVideo.assets.interactions;
        var notAllowedInteractions = ['H5P.Text', 'H5P.Table', 'H5P.Link', 'H5P.Image', 'H5P.GoToQuestion', 'H5P.Summery'];
        var interactionsCounter = 0;

        if(typeof interactions === 'object') {
            $.each(interactions, function (i) {
                var library = interactions[i].action.library;
                var foundItem = false;

                $.each(notAllowedInteractions, function (j) {
                    if (library.indexOf(notAllowedInteractions[j]) > -1) {
                        foundItem = true;
                    }
                });

                if (!foundItem) interactionsCounter++;
            });

            OC.interactions[contentId] = interactionsCounter;
        }
    });
};

$(window).load(function () {
    OC.getVideoInteractions();
    H5P.externalDispatcher.on('xAPI', OC.xAPIAnsweredListener);
});