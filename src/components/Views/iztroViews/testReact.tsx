import { Iztrolabe } from "react-iztro";
import { IztrolabeProps } from "react-iztro/lib/Iztrolabe/Iztrolabe.type";
export const ReactView = (props?: IztrolabeProps) => {
	return (
		<div>
			<h4>Hello.asd</h4>
			{props && <Iztrolabe {...props} />}
		</div>
	);
};
