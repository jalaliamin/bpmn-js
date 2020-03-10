import {
  forEach,
  reduce
} from 'min-dash';

import { is } from '../../../util/ModelUtil';

import { isExpanded } from '../../../util/DiUtil';

import {
  LANE_MIN_DIMENSIONS,
  PARTICIPANT_MIN_DIMENSIONS,
  SUB_PROCESS_MIN_DIMENSIONS,
  TEXT_ANNOTATION_MIN_DIMENSIONS
} from './ResizeBehavior';

import { getChildLanes } from '../util/LaneUtil';

var max = Math.max;

var AXIS_TO_DIMENSION = {
  x: 'width',
  y: 'height'
};


export default function SpaceToolBehavior(eventBus) {
  eventBus.on('spaceTool.getMinDimensions', function(context) {
    var shapes = context.shapes,
        axis = context.axis,
        start = context.start,
        minDimensions = {};

    forEach(shapes, function(shape) {
      var id = shape.id;

      if (is(shape, 'bpmn:Participant')) {
        minDimensions[ id ] = getParticipantMinDimensions(shape, axis, start);
      }

      if (is(shape, 'bpmn:SubProcess') && isExpanded(shape)) {
        minDimensions[ id ] = SUB_PROCESS_MIN_DIMENSIONS;
      }

      if (is(shape, 'bpmn:TextAnnotation')) {
        minDimensions[ id ] = TEXT_ANNOTATION_MIN_DIMENSIONS;
      }
    });

    return minDimensions;
  });
}

SpaceToolBehavior.$inject = [ 'eventBus' ];


// helpers //////////

/**
 * Get minimum dimensions for participant taking lanes into account.
 *
 * @param {<djs.model.Shape>} participant
 * @param {string} axis
 * @param {number} start
 *
 * @returns {Object}
 */
function getParticipantMinDimensions(participant, axis, start) {
  var lanes = getChildLanes(participant);

  if (!lanes.length) {
    return PARTICIPANT_MIN_DIMENSIONS;
  }

  var minDimensions = reduce(lanes, function(minDimensions, lane) {
    var dimension = AXIS_TO_DIMENSION[ axis ];

    if (start >= lane[ axis ] && start <= lane[ axis ] + lane[ dimension ]) {

      // resizing lane
      minDimensions[ dimension ] += lane[ axis ] + LANE_MIN_DIMENSIONS[ dimension ] - participant[ axis ];
    } else if (axis === 'y' && start <= lane.y) {

      // lane after resizing lane
      minDimensions.height += lane.height;
    }

    return minDimensions;
  }, {
    width: 0,
    height: 0
  });

  return {
    width: max(PARTICIPANT_MIN_DIMENSIONS.width, minDimensions.width),
    height: max(PARTICIPANT_MIN_DIMENSIONS.height, minDimensions.height)
  };
}
