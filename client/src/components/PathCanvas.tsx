import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path as SvgPath,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import { PathNode } from '../api';
import { PathNodeItem, NODE_SIZE } from './PathNodeItem';
import { colors } from '../theme';

interface PathCanvasProps {
  nodes: PathNode[];
  onNodePress: (
    node: PathNode,
    layout: { x: number; y: number; width: number; height: number; pageX: number; pageY: number }
  ) => void;
  width?: number;
}

export const ROW_HEIGHT = 135;
export const TOP_PADDING = 50;
export const BOTTOM_PADDING = 120;

interface Point {
  x: number;
  y: number;
}

interface Connector {
  id: string;
  from: Point;
  to: Point;
  fromNode: PathNode;
  toNode: PathNode;
  type: 'trunk' | 'branch-out' | 'branch-merge';
}

export function PathCanvas({
  nodes,
  onNodePress,
  width = Dimensions.get('window').width,
}: PathCanvasProps) {
  // Calculate total canvas height from nodes
  const maxY = useMemo(() => {
    if (!nodes.length) return 600;
    const highestY = Math.max(...nodes.map((n) => n.position.y));
    return highestY * ROW_HEIGHT + TOP_PADDING + BOTTOM_PADDING;
  }, [nodes]);

  // Compute absolute pixel coordinates for each node
  const nodeCoordinates = useMemo(() => {
    const map = new Map<string, { x: number; y: number; node: PathNode }>();
    nodes.forEach((node) => {
      // Clamp x so nodes don't clip off left or right edge (node width is ~120px)
      const clampedX = Math.max(0.18, Math.min(0.82, node.position.x));
      const px = clampedX * width;
      const py = node.position.y * ROW_HEIGHT + TOP_PADDING;
      map.set(node.id, { x: px, y: py, node });
    });
    return map;
  }, [nodes, width]);

  // Generate cubic Bezier connectors
  const connectors = useMemo(() => {
    const list: Connector[] = [];
    const trunkNodes = nodes.filter((n) => !n.isBranch);
    const branchNodes = nodes.filter((n) => n.isBranch);

    // 1. Trunk sequential connections
    for (let i = 0; i < trunkNodes.length - 1; i++) {
      const fromNode = trunkNodes[i];
      const toNode = trunkNodes[i + 1];
      const fromPos = nodeCoordinates.get(fromNode.id);
      const toPos = nodeCoordinates.get(toNode.id);

      if (fromPos && toPos) {
        list.push({
          id: `trunk-${fromNode.id}-${toNode.id}`,
          from: { x: fromPos.x, y: fromPos.y },
          to: { x: toPos.x, y: toPos.y },
          fromNode,
          toNode,
          type: 'trunk',
        });
      }
    }

    // 2. Branch offshoot and merge connections
    branchNodes.forEach((bNode) => {
      const bPos = nodeCoordinates.get(bNode.id);
      if (!bPos) return;

      // Branch offshoot from parent
      if (bNode.branchParentId) {
        const parentPos = nodeCoordinates.get(bNode.branchParentId);
        const parentNode = nodes.find((n) => n.id === bNode.branchParentId);
        if (parentPos && parentNode) {
          list.push({
            id: `branch-out-${parentNode.id}-${bNode.id}`,
            from: { x: parentPos.x, y: parentPos.y },
            to: { x: bPos.x, y: bPos.y },
            fromNode: parentNode,
            toNode: bNode,
            type: 'branch-out',
          });
        }
      }

      // Branch merge to target
      if (bNode.mergeTargetId) {
        const targetPos = nodeCoordinates.get(bNode.mergeTargetId);
        const targetNode = nodes.find((n) => n.id === bNode.mergeTargetId);
        if (targetPos && targetNode) {
          list.push({
            id: `branch-merge-${bNode.id}-${targetNode.id}`,
            from: { x: bPos.x, y: bPos.y },
            to: { x: targetPos.x, y: targetPos.y },
            fromNode: bNode,
            toNode: targetNode,
            type: 'branch-merge',
          });
        }
      }
    });

    return list;
  }, [nodes, nodeCoordinates]);

  // Helper to build cubic Bezier curve string
  const buildBezierPath = (p1: Point, p2: Point) => {
    const dy = p2.y - p1.y;
    const cy1 = p1.y + dy * 0.45;
    const cy2 = p2.y - dy * 0.45;
    return `M ${p1.x} ${p1.y} C ${p1.x} ${cy1}, ${p2.x} ${cy2}, ${p2.x} ${p2.y}`;
  };

  return (
    <View style={[styles.canvasContainer, { width, height: maxY }]}>
      {/* ── SVG Path Track Connectors ── */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={maxY}>
        <Defs>
          <SvgGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#58CC02" />
            <Stop offset="100%" stopColor="#00C4B4" />
          </SvgGradient>
          <SvgGradient id="perfectGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#FFA000" />
          </SvgGradient>
          <SvgGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#00C4B4" />
            <Stop offset="100%" stopColor="#1CB0F6" />
          </SvgGradient>
        </Defs>

        {connectors.map((c) => {
          const pathD = buildBezierPath(c.from, c.to);
          const isFromCompleted =
            c.fromNode.state === 'COMPLETED' ||
            c.fromNode.state === 'PERFECT' ||
            c.fromNode.state === 'REVIEW';
          const isToCompleted =
            c.toNode.state === 'COMPLETED' ||
            c.toNode.state === 'PERFECT' ||
            c.toNode.state === 'REVIEW';
          const isToCurrent = c.toNode.state === 'CURRENT';

          if (isFromCompleted && isToCompleted) {
            // Solid vibrant completed path with 3D shadow layer
            return (
              <React.Fragment key={c.id}>
                {/* 3D Depth Under-Shadow */}
                <SvgPath
                  d={pathD}
                  stroke="#388E3C"
                  strokeWidth={9}
                  strokeLinecap="round"
                  fill="none"
                  translateY={2}
                />
                {/* Vibrant Top Track */}
                <SvgPath
                  d={pathD}
                  stroke="url(#completedGrad)"
                  strokeWidth={7}
                  strokeLinecap="round"
                  fill="none"
                />
              </React.Fragment>
            );
          } else if (isFromCompleted && isToCurrent) {
            // Animated active dash track leading into CURRENT node
            return (
              <React.Fragment key={c.id}>
                <SvgPath
                  d={pathD}
                  stroke="#E5E5EA"
                  strokeWidth={8}
                  strokeLinecap="round"
                  fill="none"
                />
                <SvgPath
                  d={pathD}
                  stroke="url(#currentGrad)"
                  strokeWidth={6}
                  strokeDasharray="9, 7"
                  strokeLinecap="round"
                  fill="none"
                />
              </React.Fragment>
            );
          } else {
            // Dim dashed line into LOCKED nodes
            return (
              <SvgPath
                key={c.id}
                d={pathD}
                stroke="#D6D6DC"
                strokeWidth={5}
                strokeDasharray="7, 7"
                strokeLinecap="round"
                fill="none"
              />
            );
          }
        })}
      </Svg>

      {/* ── Path Node Items (Positioned absolutely on top of SVG canvas) ── */}
      {nodes.map((node) => {
        const pos = nodeCoordinates.get(node.id);
        if (!pos) return null;

        return (
          <View
            key={node.id}
            style={[
              styles.nodePlacement,
              {
                left: pos.x - 60, // center 120px wide component at pos.x
                top: pos.y - NODE_SIZE / 2,
              },
            ]}
          >
            <PathNodeItem node={node} onPress={onNodePress} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  canvasContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  nodePlacement: {
    position: 'absolute',
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
